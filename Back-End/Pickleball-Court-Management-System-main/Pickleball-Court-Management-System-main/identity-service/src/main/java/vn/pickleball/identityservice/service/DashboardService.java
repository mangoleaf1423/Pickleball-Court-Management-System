package vn.pickleball.identityservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.identityservice.client.CourtClient;
import vn.pickleball.identityservice.dto.AnalysisTarget;
import vn.pickleball.identityservice.dto.AnalysisType;
import vn.pickleball.identityservice.dto.request.*;
import vn.pickleball.identityservice.dto.response.*;
import vn.pickleball.identityservice.entity.*;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.mapper.OrderMapper;
import vn.pickleball.identityservice.mapper.OrderMapperCustom;
import vn.pickleball.identityservice.mapper.TransactionMapper;
import vn.pickleball.identityservice.repository.OrderRepository;
import vn.pickleball.identityservice.repository.OrderSpecification;
import vn.pickleball.identityservice.repository.TransactionRepository;
import vn.pickleball.identityservice.utils.SecurityContextUtil;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DashboardService {
    private final TransactionService transactionService;
    private final TransactionMapper transactionMapper;
    private final OrderService orderService;
    private final UserService userService;
    private final CourtClient courtClient;
    private final OrderMapperCustom orderMapperCustom;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public TransactionResponse getTransactionsWithSummary(String paymentStatus, String courtId,String orderId,
                                                          LocalDateTime startDate, LocalDateTime endDate,
                                                          int page, int size) {

        List<String> courtIds;

        if (courtId != null) {
            courtIds = Collections.singletonList(getCourtIdManage(courtId));
        } else {
            boolean isManager = SecurityContextUtil.isManager();
            if (isManager) {
                courtIds = getCourtIdsManage(null);
            } else {
                courtIds = courtClient.getCourtIds().getBody();
            }
        }

        var transactionsPage = transactionService.getTransactions(paymentStatus, courtIds, orderId,startDate, endDate, page, size);

        BigDecimal totalAmount = transactionService.getTotalAmountExcludingRefund(courtIds, orderId,startDate, endDate);
        BigDecimal refundAmount = transactionService.getTotalRefundAmount(courtIds, orderId, startDate, endDate);
        BigDecimal netAmount = totalAmount.subtract(refundAmount);

        List<TransactionDto> transactionDtos = transactionMapper.toDtoList(transactionsPage.getContent());

        return TransactionResponse.builder()
                .transactions(transactionDtos)
                .totalPages(transactionsPage.getTotalPages())
                .totalElements(transactionsPage.getTotalElements())
                .totalAmount(totalAmount)
                .refundAmount(refundAmount)
                .netAmount(netAmount)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public OrderPage searchOrders(String courtId,String orderType, String orderStatus, String paymentStatus,
                                    LocalDate startDate, LocalDate endDate, int page, int size) {

        List<String> courtIds;

        if (courtId != null) {
            courtIds = Collections.singletonList(getCourtIdManage(courtId));
        } else {
            boolean isManager = SecurityContextUtil.isManager();
            if (isManager) {
                courtIds = getCourtIdsManage(null);
            } else {
                courtIds = courtClient.getCourtIds().getBody();
            }
        }
        Page<Order> ordersPage = orderService.getOrders(courtIds, orderType, orderStatus, paymentStatus, startDate, endDate, page, size);

        List<OrderData> orderData = orderMapperCustom.toOrderDataList(ordersPage.getContent());

        return OrderPage.builder()
                .orders(orderData)
                .totalElements(ordersPage.getTotalElements())
                .totalPages(ordersPage.getTotalPages())
                .build();
    }



    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public List<TransactionDto> getTransactionByOrderId(String orderId){
        List<Transaction> transactions = transactionService.findByOrderId(orderId);

        return transactionMapper.toDtoList(transactions);
    }


    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public RevenueSummaryResponse generateRevenueReport(RevenueSummaryRequest request) {
        List<String> inputCourtIds = request.getFilters().getCourtIds();

        List<String> courtIds;

        // Determine court IDs based on role and request
        if (inputCourtIds != null) {
            // Case 3: Specific court ID provided
            courtIds = getCourtIdsManage(inputCourtIds);
        } else {
            // Case 1 & 2: No court ID provided
            boolean isManager = SecurityContextUtil.isManager();
            if (isManager) {
                // Case 2: MANAGER role
                courtIds = getCourtIdsManage(null);
            } else {
                // Case 1: ADMIN role
                courtIds = courtClient.getCourtIds().getBody();
            }
        }

        request.getFilters().setCourtIds(courtIds);

        List<Order> orders = orderService.searchOrdersRevenue(request);

        // 3. Calculate summary metrics
        BigDecimal totalPaid = calculateTotalPaid(orders);
        BigDecimal totalRefund = calculateTotalRefund(orders);
        BigDecimal totalDeposit = calculateTotalDeposit(orders);
        BigDecimal totalRevenue = totalPaid.subtract(totalRefund);

        // 4. Group data by period and courtId
        Map<String, List<Order>> groupedOrders = groupOrdersByPeriodAndCourt(orders, request.getGroupBy());

        // 5. Build response
        return RevenueSummaryResponse.builder()
                .summary(RevenueSummary.builder()
                        .totalRevenue(totalRevenue)
                        .totalDeposit(totalDeposit)
                        .totalPaid(totalPaid)
                        .totalRefund(totalRefund)
                        .build())
                .data(buildRevenueDataList(groupedOrders))
                .build();
    }

    private BigDecimal calculateTotalPaid(List<Order> orders) {
        return orders.stream()
                .map(Order::getAmountPaid)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateTotalRefund(List<Order> orders) {
        List<String> orderIds = orders.stream().map(Order::getId).collect(Collectors.toList());
        return transactionService.calculateTotalRefund(orderIds);
    }

    private BigDecimal calculateTotalDeposit(List<Order> orders) {
        return orders.stream()
                .map(Order::getDepositAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<String, List<Order>> groupOrdersByPeriodAndCourt(List<Order> orders, List<String> groupBy) {
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        return orders.stream()
                .filter(order -> !order.getOrderDetails().isEmpty())
                .filter(order -> !order.getOrderDetails().get(0).getBookingDates().isEmpty())
                .collect(Collectors.groupingBy(
                        order -> {
                            LocalDate bookingDate = order.getOrderDetails().get(0).getBookingDates().get(0).getBookingDate();

                            // Xác định period (ngày/tháng) nếu được yêu cầu
                            String period = "";
                            if (groupBy.contains("day")) {
                                period = bookingDate.format(dayFormatter);
                            } else if (groupBy.contains("month")) {
                                period = bookingDate.format(monthFormatter);
                            }

                            // Xác định courtId nếu được yêu cầu
                            String courtId = groupBy.contains("courtId") ? order.getCourtId() : "ALL";

                            return !period.isEmpty() ? period + "|" + courtId + "|" : courtId + "|";
                        },
                        TreeMap::new, // Sắp xếp key tự động (theo thứ tự tăng dần)
                        Collectors.toList()
                ));
    }

    private List<RevenueData> buildRevenueDataList(Map<String, List<Order>> groupedOrders) {

        Map<String, CourtMap> courtMap = courtClient.getAllCourts().getBody().stream()
                .collect(Collectors.toMap(CourtMap::getId, court -> court));

        return groupedOrders.entrySet().stream()
                .map(entry -> {
                    String[] keys = entry.getKey().split("\\|");
                    String period = keys.length > 1 ? keys[0] : null;
                    String courtId = keys.length > 1 ? keys[1] : keys[0];

                    List<Order> groupOrders = entry.getValue();
                    BigDecimal totalPaid = calculateTotalPaid(groupOrders);
                    BigDecimal totalRefund = calculateTotalRefund(groupOrders);
                    BigDecimal totalDeposit = calculateTotalDeposit(groupOrders);
                    BigDecimal totalRevenue = totalPaid.subtract(totalRefund);

                    // Lấy courtName từ courtMap
                    CourtMap court = courtMap.get(courtId);
                    String courtName = court != null ? court.getName() : null;

                    return RevenueData.builder()
                            .period(period)
                            .courtId(courtId)
                            .courtName(courtName)
                            .totalRevenue(totalRevenue)
                            .depositAmount(totalDeposit)
                            .paidAmount(totalPaid)
                            .refundAmount(totalRefund)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public OccupancyAnalysisResponse analyzeOccupancy(OccupancyAnalysisRequest request) {
        String courtId = request.getCourtId();
        List<String> courtIds;

        // Determine court IDs based on role and request
        if (courtId != null) {
            // Case 3: Specific court ID provided
            courtIds = Collections.singletonList(getCourtIdManage(courtId));
        } else {
            // Case 1 & 2: No court ID provided
            boolean isManager = SecurityContextUtil.isManager();
            if (isManager) {
                // Case 2: MANAGER role
                courtIds = getCourtIdsManage(null);
            } else {
                // Case 1: ADMIN role
                courtIds = courtClient.getCourtIds().getBody();
            }
        }

        // Handle empty court IDs
        if (courtIds == null || courtIds.isEmpty()) {
            OccupancyAnalysisResponse response = new OccupancyAnalysisResponse();
            response.setAnalysisDetails(new ArrayList<>());
            response.setTotalSlots(0);
            response.setBookedSlots(0);
            response.setOccupancyRate(0.0);
            return response;
        }

        // Fetch bookings and calculate total slots
        List<Order> bookings = orderService.fetchBookings(courtIds, request.getDateRange());
        int totalSlots = calculateTotalSlots(courtIds, request.getDateRange());

        if (courtIds.size() == 1) {
            // Single court case
            String singleCourtId = courtIds.get(0);
            CourtPriceResponse courtPrice = fetchCourtTimeSlots(singleCourtId);
            if (request.getAnalysisType() == AnalysisType.BY_DAY_OF_WEEK) {
                return buildDayOfWeekResponse(bookings, courtPrice, totalSlots, singleCourtId, request.getDateRange());
            } else {
                return buildHourlyResponse(bookings, courtPrice, totalSlots, singleCourtId, request.getDateRange());
            }
        } else {
            // Multiple courts case
            Map<DayOfWeek, AnalysisDetail> dayOfWeekAnalysisMap = new HashMap<>();
            Map<String, AnalysisDetail> hourlyAnalysisMap = new HashMap<>();

            for (String cid : courtIds) {
                CourtPriceResponse courtPrice = fetchCourtTimeSlots(cid);
                List<Order> courtBookings = orderService.fetchBookings(Collections.singletonList(cid), request.getDateRange());

                if (request.getAnalysisType() == AnalysisType.BY_DAY_OF_WEEK) {
                    Map<DayOfWeek, AnalysisDetail> tempMap = initializeDayOfWeekAnalysis(courtPrice, cid, request.getDateRange());
                    processBookingsForDayAnalysis(courtBookings, tempMap);
                    mergeDayOfWeekAnalysis(dayOfWeekAnalysisMap, tempMap);
                } else {
                    Map<String, AnalysisDetail> tempMap = initializeTimeSlots(courtPrice, cid, request.getDateRange());
                    processHourlyBookings(courtBookings, tempMap);
                    mergeHourlyAnalysis(hourlyAnalysisMap, tempMap);
                }
            }

            OccupancyAnalysisResponse response = new OccupancyAnalysisResponse();
            if (request.getAnalysisType() == AnalysisType.BY_DAY_OF_WEEK) {
                List<AnalysisDetail> sortedDetails = dayOfWeekAnalysisMap.values().stream()
                        .sorted(Comparator.comparing(detail -> DayOfWeek.valueOf(detail.getDayOfWeek())))
                        .collect(Collectors.toList());
                sortedDetails.forEach(detail ->
                        detail.setOccupancyRate(calculateOccupancyRate(detail.getBookedSlots(), detail.getTotalSlots()))
                );
                response.setAnalysisDetails(sortedDetails);
                response.setBookedSlots(calculateTotalBookedSlotsDay(dayOfWeekAnalysisMap));
            } else {
                List<AnalysisDetail> sortedDetails = hourlyAnalysisMap.values().stream()
                        .sorted(Comparator.comparing(detail -> {
                            String startTime = detail.getTimeRange().split("-")[0];
                            return LocalTime.parse(startTime);
                        }))
                        .collect(Collectors.toList());
                sortedDetails.forEach(detail ->
                        detail.setOccupancyRate(calculateOccupancyRate(detail.getBookedSlots(), detail.getTotalSlots()))
                );
                response.setAnalysisDetails(sortedDetails);
                response.setBookedSlots(calculateTotalBookedSlotsHour(hourlyAnalysisMap));
            }
            response.setTotalSlots(totalSlots);
            response.setOccupancyRate(calculateOccupancyRate(response.getBookedSlots(), totalSlots));
            return response;
        }
    }

    private Map<DayOfWeek, AnalysisDetail> initializeDayOfWeekAnalysis(CourtPriceResponse courtPrice, String courtId, DateRange dateRange) {
        LocalDate startDate = dateRange.getStartDate();
        LocalDate endDate = dateRange.getEndDate();

        // Count occurrences of each DayOfWeek in the date range
        Map<DayOfWeek, Long> dayCount = new HashMap<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            DayOfWeek day = current.getDayOfWeek();
            dayCount.merge(day, 1L, Long::sum);
            current = current.plusDays(1);
        }

        return dayCount.keySet().stream()
                .collect(Collectors.toMap(
                        day -> day,
                        day -> {
                            AnalysisDetail analysis = new AnalysisDetail();
                            analysis.setDayOfWeek(day.name());
                            int slotsPerDay = calculateSlotsForDay(day, courtPrice, courtId);
                            long days = dayCount.getOrDefault(day, 0L);
                            analysis.setTotalSlots(slotsPerDay * (int) days);
                            return analysis;
                        }
                ));
    }

    private void processBookingsForDayAnalysis(
            List<Order> bookings,
            Map<DayOfWeek, AnalysisDetail> analysisMap
    ) {
        bookings.forEach(order ->
                order.getOrderDetails().forEach(detail -> {
                    String orderType = order.getOrderType();
                    if ("Đơn cố định".equals(orderType)) {
                        // Fixed order: Count 30-minute slots per BookingDate
                        detail.getBookingDates().forEach(bookingDate -> {
                            DayOfWeek day = bookingDate.getBookingDate().getDayOfWeek();
                            AnalysisDetail analysis = analysisMap.get(day);
                            if (analysis != null) {
                                int slots = calculateSlotsInRange(detail.getStartTime(), detail.getEndTime());
                                analysis.setBookedSlots(analysis.getBookedSlots() + slots);
                            }
                        });
                    } else if ("Đơn ngày".equals(orderType)) {
                        // Daily order: Count one slot per BookingDate
                        detail.getBookingDates().forEach(bookingDate -> {
                            DayOfWeek day = bookingDate.getBookingDate().getDayOfWeek();
                            AnalysisDetail analysis = analysisMap.get(day);
                            if (analysis != null) {
                                analysis.setBookedSlots(analysis.getBookedSlots() + 1);
                            }
                        });
                    }
                })
        );
    }

    private OccupancyAnalysisResponse buildDayOfWeekResponse(
            List<Order> bookings,
            CourtPriceResponse courtPrice,
            int totalSlots,
            String courtId,
            DateRange dateRange
    ) {
        Map<DayOfWeek, AnalysisDetail> analysisMap = initializeDayOfWeekAnalysis(courtPrice, courtId, dateRange);
        processBookingsForDayAnalysis(bookings, analysisMap);

        // Sort by DayOfWeek (Monday to Sunday)
        List<AnalysisDetail> sortedDetails = analysisMap.values().stream()
                .sorted(Comparator.comparing(detail -> DayOfWeek.valueOf(detail.getDayOfWeek())))
                .collect(Collectors.toList());

        sortedDetails.forEach(detail ->
                detail.setOccupancyRate(calculateOccupancyRate(detail.getBookedSlots(), detail.getTotalSlots()))
        );

        OccupancyAnalysisResponse response = new OccupancyAnalysisResponse();
        response.setAnalysisDetails(sortedDetails);
        response.setTotalSlots(totalSlots);
        response.setBookedSlots(calculateTotalBookedSlotsDay(analysisMap));
        response.setOccupancyRate(calculateOccupancyRate(response.getBookedSlots(), totalSlots));
        return response;
    }

    private void mergeDayOfWeekAnalysis(
            Map<DayOfWeek, AnalysisDetail> target,
            Map<DayOfWeek, AnalysisDetail> source
    ) {
        source.forEach((day, detail) -> {
            AnalysisDetail existing = target.computeIfAbsent(day, k -> new AnalysisDetail());
            existing.setDayOfWeek(day.name());
            existing.setTotalSlots(existing.getTotalSlots() + detail.getTotalSlots());
            existing.setBookedSlots(existing.getBookedSlots() + detail.getBookedSlots());
        });
    }

    private Map<String, AnalysisDetail> initializeTimeSlots(CourtPriceResponse courtPrice, String courtId, DateRange dateRange) {
        Map<String, AnalysisDetail> hourlyAnalysis = new LinkedHashMap<>();
        LocalDate startDate = dateRange.getStartDate();
        LocalDate endDate = dateRange.getEndDate();
        int courtSlotsCount = getNumberCourtSlot(courtId);

        // Count weekday and weekend days
        long weekdayDays = 0;
        long weekendDays = 0;
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
                weekendDays++;
            } else {
                weekdayDays++;
            }
            current = current.plusDays(1);
        }

        List<CourtPriceResponse.CourtTimeSlot> weekdaySlots = courtPrice.getWeekdayTimeSlots();
        List<CourtPriceResponse.CourtTimeSlot> weekendSlots = courtPrice.getWeekendTimeSlots() != null ?
                courtPrice.getWeekendTimeSlots() : courtPrice.getWeekdayTimeSlots();

        // Process weekday slots
        long finalWeekdayDays = weekdayDays;
        weekdaySlots.forEach(slot -> {
            LocalTime start = LocalTime.parse(slot.getStartTime());
            LocalTime end = LocalTime.parse(slot.getEndTime());
            processTimeRange(start, end, hourlyAnalysis, finalWeekdayDays, courtSlotsCount);
        });

        // Process weekend slots
        long finalWeekendDays = weekendDays;
        weekendSlots.forEach(slot -> {
            LocalTime start = LocalTime.parse(slot.getStartTime());
            LocalTime end = LocalTime.parse(slot.getEndTime());
            processTimeRange(start, end, hourlyAnalysis, finalWeekendDays, courtSlotsCount);
        });

        return hourlyAnalysis;
    }

    private void processTimeRange(
            LocalTime start,
            LocalTime end,
            Map<String, AnalysisDetail> hourlyAnalysis,
            long days,
            int courtSlotsCount
    ) {
        LocalTime current = start;
        while (current.isBefore(end)) {
            LocalTime slotEnd = current.plusMinutes(30);
            if (slotEnd.isAfter(end)) {
                slotEnd = end;
            }

            String timeRange = formatTimeRange(current, slotEnd);
            AnalysisDetail analysis = hourlyAnalysis.computeIfAbsent(timeRange, k -> new AnalysisDetail());
            analysis.setTimeRange(timeRange);
            analysis.setTotalSlots(analysis.getTotalSlots() + ((int) days * courtSlotsCount));
            current = slotEnd;
        }
    }

    private String formatTimeRange(LocalTime start, LocalTime end) {
        return String.format("%s-%s", start.toString(), end.toString());
    }

    private void processHourlyBookings(
            List<Order> bookings,
            Map<String, AnalysisDetail> hourlyAnalysis
    ) {
        bookings.forEach(order ->
                order.getOrderDetails().forEach(detail ->
                        detail.getBookingDates().forEach(bookingDate -> {
                            LocalTime current = detail.getStartTime();
                            while (current.isBefore(detail.getEndTime())) {
                                LocalTime slotEnd = current.plusMinutes(30);
                                if (slotEnd.isAfter(detail.getEndTime())) {
                                    slotEnd = detail.getEndTime();
                                }
                                String timeRange = formatTimeRange(current, slotEnd);
                                AnalysisDetail analysis = hourlyAnalysis.get(timeRange);
                                if (analysis != null) {
                                    analysis.setBookedSlots(analysis.getBookedSlots() + 1);
                                }
                                current = slotEnd;
                            }
                        })
                )
        );
    }

    private OccupancyAnalysisResponse buildHourlyResponse(
            List<Order> bookings,
            CourtPriceResponse courtPrice,
            int totalSlots,
            String courtId,
            DateRange dateRange
    ) {
        Map<String, AnalysisDetail> hourlyAnalysis = initializeTimeSlots(courtPrice, courtId, dateRange);
        processHourlyBookings(bookings, hourlyAnalysis);

        // Sort by timeRange (chronological order)
        List<AnalysisDetail> sortedDetails = hourlyAnalysis.values().stream()
                .sorted(Comparator.comparing(detail -> {
                    String startTime = detail.getTimeRange().split("-")[0];
                    return LocalTime.parse(startTime);
                }))
                .collect(Collectors.toList());

        sortedDetails.forEach(detail ->
                detail.setOccupancyRate(calculateOccupancyRate(detail.getBookedSlots(), detail.getTotalSlots()))
        );

        OccupancyAnalysisResponse response = new OccupancyAnalysisResponse();
        response.setAnalysisDetails(sortedDetails);
        response.setTotalSlots(totalSlots);
        response.setBookedSlots(calculateTotalBookedSlotsHour(hourlyAnalysis));
        response.setOccupancyRate(calculateOccupancyRate(response.getBookedSlots(), totalSlots));
        return response;
    }

    private void mergeHourlyAnalysis(
            Map<String, AnalysisDetail> target,
            Map<String, AnalysisDetail> source
    ) {
        source.forEach((timeRange, detail) -> {
            AnalysisDetail existing = target.computeIfAbsent(timeRange, k -> new AnalysisDetail());
            existing.setTimeRange(timeRange);
            existing.setTotalSlots(existing.getTotalSlots() + detail.getTotalSlots());
            existing.setBookedSlots(existing.getBookedSlots() + detail.getBookedSlots());
        });
    }

    private int calculateTotalSlots(List<String> courtIds, DateRange dateRange) {
        LocalDate startDate = dateRange.getStartDate();
        LocalDate endDate = dateRange.getEndDate();

        long weekdayDays = 0;
        long weekendDays = 0;
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
                weekendDays++;
            } else {
                weekdayDays++;
            }
            current = current.plusDays(1);
        }

        int totalSlots = 0;
        for (String cid : courtIds) {
            CourtPriceResponse courtPrice = fetchCourtTimeSlots(cid);
            int weekdaySlotsPerDay = calculateSlotsPerDay(courtPrice, false);
            int weekendSlotsPerDay = calculateSlotsPerDay(courtPrice, true);
            int courtSlotsCount = getNumberCourtSlot(cid);
            totalSlots += (weekdaySlotsPerDay * weekdayDays * courtSlotsCount) +
                    (weekendSlotsPerDay * weekendDays * courtSlotsCount);
        }
        return totalSlots;
    }

    private int calculateSlotsPerDay(CourtPriceResponse courtPrice, boolean isWeekend) {
        List<CourtPriceResponse.CourtTimeSlot> slots = isWeekend && courtPrice.getWeekendTimeSlots() != null ?
                courtPrice.getWeekendTimeSlots() :
                courtPrice.getWeekdayTimeSlots();

        return slots.stream()
                .mapToInt(slot -> {
                    LocalTime start = LocalTime.parse(slot.getStartTime());
                    LocalTime end = LocalTime.parse(slot.getEndTime());
                    long minutes = Duration.between(start, end).toMinutes();
                    return (int) Math.ceil((double) minutes / 30);
                })
                .sum();
    }

    private int calculateSlotsForDay(DayOfWeek dayOfWeek, CourtPriceResponse courtPrice, String courtId) {
        boolean isWeekend = dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
        List<CourtPriceResponse.CourtTimeSlot> slots = isWeekend && courtPrice.getWeekendTimeSlots() != null ?
                courtPrice.getWeekendTimeSlots() :
                courtPrice.getWeekdayTimeSlots();

        int slotsPerDay = slots.stream()
                .mapToInt(slot -> calculateSlotsInRange(
                        LocalTime.parse(slot.getStartTime()),
                        LocalTime.parse(slot.getEndTime())
                ))
                .sum();

        int courtSlotsCount = getNumberCourtSlot(courtId);
        return slotsPerDay * courtSlotsCount;
    }

    private int calculateTotalBookedSlotsDay(Map<DayOfWeek, AnalysisDetail> analysisMap) {
        return analysisMap.values().stream()
                .mapToInt(AnalysisDetail::getBookedSlots)
                .sum();
    }

    private int calculateTotalBookedSlotsHour(Map<String, AnalysisDetail> hourlyAnalysis) {
        return hourlyAnalysis.values().stream()
                .mapToInt(AnalysisDetail::getBookedSlots)
                .sum();
    }

    private double calculateOccupancyRate(int bookedSlots, int totalSlots) {
        return totalSlots > 0 ? Math.min(((double) bookedSlots / totalSlots) * 100, 100.0) : 0.0;
    }

    private int calculateSlotsInRange(LocalTime start, LocalTime end) {
        long totalMinutes = Duration.between(start, end).toMinutes();
        return (int) Math.ceil((double) totalMinutes / 30);
    }

    private int getNumberCourtSlot(String courtId) {
        try {
            List<String> courtSlotIds = courtClient.getCourtSlotIdsByCourtId(courtId).getBody();
            return courtSlotIds != null ? courtSlotIds.size() : 1;
        } catch (Exception e) {
            log.error("Failed to fetch court slots for courtId: {}", courtId, e);
            return 1;
        }
    }

    private CourtPriceResponse fetchCourtTimeSlots(String courtId) {
        return courtClient.getCourtPriceByCourtId(courtId);
    }

    private String getCourtIdManage(String courtId) {
        boolean isManager = SecurityContextUtil.isManager();
        if (!isManager) return courtId;

        List<String> managedCourtIds = userService.getCourtsByUserId(SecurityContextUtil.getUid());
        if (managedCourtIds == null || !managedCourtIds.contains(courtId)) {
            throw new IllegalArgumentException("User does not have permission to manage court: " + courtId);
        }
        return courtId;
    }

    private List<String> getCourtIdsManage(List<String> courtIds) {
        boolean isManager = SecurityContextUtil.isManager();
        if (!isManager) return courtIds;

        List<String> managedCourtIds = userService.getCourtsByUserId(SecurityContextUtil.getUid());
        if (managedCourtIds == null || managedCourtIds.isEmpty()) {
            return Collections.emptyList();
        }
        return managedCourtIds;
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public PeakHoursAnalysisResponse analyzePeakHours(PeakHoursAnalysisRequest request) {
        String courtId = request.getCourtId();
        List<String> courtIds;
        if (courtId != null) {
            courtIds = Collections.singletonList(getCourtIdManage(courtId));
        } else {
            boolean isManager = SecurityContextUtil.isManager();
            if (isManager) {
                courtIds = getCourtIdsManage(null);
            } else {
                courtIds = courtClient.getCourtIds().getBody();
            }
        }

        // Handle empty court IDs
        if (courtIds == null || courtIds.isEmpty()) {
            PeakHoursAnalysisResponse response = new PeakHoursAnalysisResponse();
            response.setPeakResults(new ArrayList<>());
            return response;
        }

        // Fetch bookings for the determined court IDs
        List<Order> bookings = orderService.fetchBookings(courtIds, request.getDateRange());

        // Process based on analysis target
        if (request.getAnalysisTarget() == AnalysisTarget.TOP_DAYS) {
            return analyzeTopDays(bookings, request, courtIds);
        } else if (request.getAnalysisTarget() == AnalysisTarget.TOP_DAYS_OF_WEEK) {
            return analyzeTopDaysOfWeek(bookings, request, courtIds);
        } else {
            return analyzeTopHours(bookings, request, courtIds);
        }
    }

    private PeakHoursAnalysisResponse analyzeTopDays(List<Order> bookings, PeakHoursAnalysisRequest request, List<String> courtIds) {
        // Count bookings per day
        Map<LocalDate, Long> dailyCounts = bookings.stream()
                .flatMap(order -> order.getOrderDetails().stream())
                .flatMap(detail -> detail.getBookingDates().stream())
                .collect(Collectors.groupingBy(
                        BookingDate::getBookingDate,
                        Collectors.counting()
                ));

        // Get top days
        List<PeakResult> topDays = dailyCounts.entrySet().stream()
                .sorted(Map.Entry.<LocalDate, Long>comparingByValue().reversed()
                        .thenComparing(Map.Entry::getKey))
                .limit(request.getTopCount())
                .map(entry -> {
                    PeakResult result = new PeakResult();
                    result.setDate(entry.getKey());
                    result.setDayOfWeek(entry.getKey().getDayOfWeek().name());
                    result.setBookingCount(entry.getValue().intValue());
                    return result;
                })
                .collect(Collectors.toList());

        // Calculate occupancy rate
        topDays.forEach(result -> {
            int totalSlots = 0;
            for (String cid : courtIds) {
                CourtPriceResponse courtPrice = fetchCourtTimeSlots(cid);
                totalSlots += calculateSlotsForDay(
                        DayOfWeek.valueOf(result.getDayOfWeek()),
                        courtPrice,
                        cid
                );
            }
            result.setOccupancyRate(calculateOccupancyRate(result.getBookingCount(), totalSlots));
        });

        // Sort by date (ascending)
        topDays.sort(Comparator.comparing(PeakResult::getDate));

        PeakHoursAnalysisResponse response = new PeakHoursAnalysisResponse();
        response.setPeakResults(topDays);
        return response;
    }

    private PeakHoursAnalysisResponse analyzeTopDaysOfWeek(List<Order> bookings, PeakHoursAnalysisRequest request, List<String> courtIds) {
        // Count bookings per DayOfWeek
        Map<DayOfWeek, Long> dayOfWeekCounts = bookings.stream()
                .flatMap(order -> order.getOrderDetails().stream())
                .flatMap(detail -> {
                    String orderType = detail.getOrder().getOrderType();
                    if ("Đơn cố định".equals(orderType)) {
                        // Count slots for fixed orders
                        int slots = calculateSlotsInRange(detail.getStartTime(), detail.getEndTime());
                        return detail.getBookingDates().stream()
                                .flatMap(bookingDate ->
                                        Stream.generate(() -> bookingDate)
                                                .limit(slots)
                                );
                    } else {
                        // Count 1 slot for daily orders
                        return detail.getBookingDates().stream();
                    }
                })
                .map(bookingDate -> bookingDate.getBookingDate().getDayOfWeek())
                .collect(Collectors.groupingBy(
                        Function.identity(),
                        Collectors.counting()
                ));

        // Calculate days per DayOfWeek in range
        LocalDate startDate = request.getDateRange().getStartDate();
        LocalDate endDate = request.getDateRange().getEndDate();
        Map<DayOfWeek, Long> dayOccurrences = new HashMap<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            DayOfWeek day = current.getDayOfWeek();
            dayOccurrences.merge(day, 1L, Long::sum);
            current = current.plusDays(1);
        }

        // Get top days of week
        List<PeakResult> topDaysOfWeek = dayOfWeekCounts.entrySet().stream()
                .sorted(Map.Entry.<DayOfWeek, Long>comparingByValue().reversed())
                .limit(request.getTopCount())
                .map(entry -> {
                    PeakResult result = new PeakResult();
                    result.setDate(null);
                    result.setDayOfWeek(entry.getKey().name());
                    result.setBookingCount(entry.getValue().intValue());
                    return result;
                })
                .collect(Collectors.toList());

        // Calculate occupancy rate
        topDaysOfWeek.forEach(result -> {
            int totalSlots = 0;
            DayOfWeek day = DayOfWeek.valueOf(result.getDayOfWeek());
            long days = dayOccurrences.getOrDefault(day, 0L);
            for (String cid : courtIds) {
                CourtPriceResponse courtPrice = fetchCourtTimeSlots(cid);
                int slotsPerDay = calculateSlotsForDay(day, courtPrice, cid);
                totalSlots += slotsPerDay * (int) days;
            }
            result.setOccupancyRate(calculateOccupancyRate(result.getBookingCount(), totalSlots));
        });

        // Sort by DayOfWeek (Monday to Sunday)
        topDaysOfWeek.sort(Comparator.comparing(result -> DayOfWeek.valueOf(result.getDayOfWeek())));

        PeakHoursAnalysisResponse response = new PeakHoursAnalysisResponse();
        response.setPeakResults(topDaysOfWeek);
        return response;
    }

    private PeakHoursAnalysisResponse analyzeTopHours(List<Order> bookings, PeakHoursAnalysisRequest request, List<String> courtIds) {
        // Count bookings per time range
        Map<String, Long> hourlyCounts = bookings.stream()
                .flatMap(order -> order.getOrderDetails().stream())
                .flatMap(detail -> detail.getBookingDates().stream()
                        .flatMap(bookingDate -> {
                            LocalTime start = detail.getStartTime();
                            LocalTime end = detail.getEndTime();
                            List<String> timeRanges = new ArrayList<>();
                            LocalTime current = start;

                            while (current.isBefore(end)) {
                                LocalTime slotEnd = current.plusMinutes(30);
                                if (slotEnd.isAfter(end)) {
                                    slotEnd = end;
                                }
                                timeRanges.add(formatTimeRange(current, slotEnd));
                                current = slotEnd;
                            }
                            return timeRanges.stream();
                        }))
                .collect(Collectors.groupingBy(
                        Function.identity(),
                        Collectors.counting()
                ));

        // Get top hours
        List<PeakResult> topHours = hourlyCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed()
                        .thenComparing(entry -> {
                            String startTime = entry.getKey().split("-")[0];
                            return LocalTime.parse(startTime);
                        }))
                .limit(request.getTopCount())
                .map(entry -> {
                    PeakResult result = new PeakResult();
                    result.setTimeRange(entry.getKey());
                    result.setBookingCount(entry.getValue().intValue());
                    return result;
                })
                .collect(Collectors.toList());

        // Calculate occupancy rate
        topHours.forEach(hour -> {
            int totalSlots = 0;
            for (String cid : courtIds) {
                CourtPriceResponse courtPrice = fetchCourtTimeSlots(cid);
                totalSlots += calculateTotalSlotsForTimeRange(hour.getTimeRange(), courtPrice, request, cid);
            }
            hour.setOccupancyRate(calculateOccupancyRate(hour.getBookingCount(), totalSlots));
        });

        PeakHoursAnalysisResponse response = new PeakHoursAnalysisResponse();
        response.setPeakResults(topHours);
        return response;
    }

    private int calculateTotalSlotsForTimeRange(
            String timeRange,
            CourtPriceResponse courtPrice,
            PeakHoursAnalysisRequest request,
            String courtId
    ) {
        // Parse time range
        String[] parts = timeRange.split("-");
        LocalTime start = LocalTime.parse(parts[0]);
        LocalTime end = LocalTime.parse(parts[1]);

        // Get weekday and weekend days
        LocalDate startDate = request.getDateRange().getStartDate();
        LocalDate endDate = request.getDateRange().getEndDate();
        long weekdayDays = 0;
        long weekendDays = 0;
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
                weekendDays++;
            } else {
                weekdayDays++;
            }
            current = current.plusDays(1);
        }

        // Get court slots count
        int courtSlotsCount = getNumberCourtSlot(courtId);

        // Check if time range falls within weekday or weekend slots
        List<CourtPriceResponse.CourtTimeSlot> weekdaySlots = courtPrice.getWeekdayTimeSlots();
        List<CourtPriceResponse.CourtTimeSlot> weekendSlots = courtPrice.getWeekendTimeSlots() != null ?
                courtPrice.getWeekendTimeSlots() : courtPrice.getWeekdayTimeSlots();

        int totalSlots = 0;

        // Weekday slots
        for (CourtPriceResponse.CourtTimeSlot slot : weekdaySlots) {
            LocalTime slotStart = LocalTime.parse(slot.getStartTime());
            LocalTime slotEnd = LocalTime.parse(slot.getEndTime());
            if (!start.isBefore(slotStart) && !end.isAfter(slotEnd)) {
                totalSlots += weekdayDays * courtSlotsCount;
            }
        }

        // Weekend slots
        for (CourtPriceResponse.CourtTimeSlot slot : weekendSlots) {
            LocalTime slotStart = LocalTime.parse(slot.getStartTime());
            LocalTime slotEnd = LocalTime.parse(slot.getEndTime());
            if (!start.isBefore(slotStart) && !end.isAfter(slotEnd)) {
                totalSlots += weekendDays * courtSlotsCount;
            }
        }

        return totalSlots;
    }


    public byte[] generateOrderReportExcel(String courtId, String orderType, String orderStatus, String paymentStatus,
                                           LocalDate startDate, LocalDate endDate) {

        List<String> courtIds;

        // Determine court IDs based on role and request
        if (courtId != null) {
            // Case 3: Specific court ID provided
            courtIds = Collections.singletonList(getCourtIdManage(courtId));
        } else {
            // Case 1 & 2: No court ID provided
            boolean isManager = SecurityContextUtil.isManager();
            if (isManager) {
                // Case 2: MANAGER role
                courtIds = getCourtIdsManage(null);
            } else {
                // Case 1: ADMIN role
                courtIds = courtClient.getCourtIds().getBody();
            }
        }
        List<Order> orders = orderService.findOrdersByFilters(courtIds, orderType, orderStatus, paymentStatus, startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Order Report");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "Order ID", "Court ID", "Customer Name", "Phone Number", "Order Type",
                    "Order Status", "Payment Status", "Total Amount", "Deposit Amount", "Discount Amount", "Amount Paid",
                    "Amount Refunded", "Payment Timeout", "Bill Code", "Order Details", "Service Details", "Transactions"
            };
            CellStyle headerStyle = createHeaderStyle(workbook);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Create data rows
            CellStyle dateStyle = createDateStyle(workbook);
            int rowNum = 1;
            for (Order order : orders) {
                Row row = sheet.createRow(rowNum++);
                int cellNum = 0;

                row.createCell(cellNum++).setCellValue(order.getId());
                row.createCell(cellNum++).setCellValue(order.getCourtId());
                row.createCell(cellNum++).setCellValue(order.getCustomerName());
                row.createCell(cellNum++).setCellValue(order.getPhoneNumber());
                row.createCell(cellNum++).setCellValue(order.getOrderType());
                row.createCell(cellNum++).setCellValue(order.getOrderStatus());
                row.createCell(cellNum++).setCellValue(order.getPaymentStatus());
                row.createCell(cellNum++).setCellValue(order.getTotalAmount() != null ? order.getTotalAmount().toString() : "");
                row.createCell(cellNum++).setCellValue(order.getDepositAmount() != null ? order.getDepositAmount().toString() : "");
                row.createCell(cellNum++).setCellValue(order.getDiscountAmount() != null ? order.getDiscountAmount().toString() : "");
                row.createCell(cellNum++).setCellValue(order.getAmountPaid() != null ? order.getAmountPaid().toString() : "");
                row.createCell(cellNum++).setCellValue(order.getAmountRefund() != null ? order.getAmountRefund().toString() : "");

                Cell paymentTimeoutCell = row.createCell(cellNum++);
                if (order.getPaymentTimeout() != null) {
                    paymentTimeoutCell.setCellValue(order.getPaymentTimeout().format(DATE_FORMATTER));
                    paymentTimeoutCell.setCellStyle(dateStyle);
                }

                row.createCell(cellNum++).setCellValue(order.getBillCode() != null ? order.getBillCode() : "");

                // Order Details
                String orderDetails = order.getOrderDetails().stream()
                        .map(od -> formatOrderDetail(od))
                        .collect(Collectors.joining("; "));
                row.createCell(cellNum++).setCellValue(orderDetails);

                // Service Details
                String serviceDetails = order.getServiceDetails().stream()
                        .map(sd -> formatServiceDetail(sd))
                        .collect(Collectors.joining("; "));
                row.createCell(cellNum++).setCellValue(serviceDetails);

                // Transactions
                String transactions = order.getTransactions().stream()
                        .map(this::formatTransaction)
                        .collect(Collectors.joining("; "));
                row.createCell(cellNum++).setCellValue(transactions);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                workbook.write(out);
                return out.toByteArray();
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel report", e);
        }
    }

    private String formatOrderDetail(OrderDetail od) {
        String bookingDates = od.getBookingDates().stream()
                .map(bd -> bd.getBookingDate().format(DATE_FORMATTER))
                .collect(Collectors.joining(", "));
        return String.format("Slot: %s, Start: %s, End: %s, Price: %s, Dates: [%s]",
                od.getCourtSlotId(),
                od.getStartTime().toString(),
                od.getEndTime().toString(),
                od.getPrice() != null ? od.getPrice().toString() : "N/A",
                bookingDates);
    }

    private String formatServiceDetail(ServiceDetailEntity sd) {
        return String.format("Service: %s, Quantity: %d, Price: %s",
                sd.getCourtServiceId(),
                sd.getQuantity(),
                sd.getPrice() != null ? sd.getPrice().toString() : "N/A");
    }

    private String formatTransaction(Transaction t) {
        return String.format("ID: %s, Amount: %s, Bill Code: %s, Created: %s",
                t.getId(),
                t.getAmount() != null ? t.getAmount().toString() : "N/A",
                t.getBillCode() != null ? t.getBillCode() : "N/A",
                t.getCreateDate() != null ? t.getCreateDate().format(DATE_FORMATTER) : "N/A");
    }

    public byte[] generateTransactionReportExcel(String paymentStatus,String courtId, String orderId,
                                                 LocalDateTime startDate, LocalDateTime endDate) {
        List<String> courtIds;

        // Determine court IDs based on role and request
        if (courtId != null) {
            // Case 3: Specific court ID provided
            courtIds = Collections.singletonList(getCourtIdManage(courtId));
        } else {
            // Case 1 & 2: No court ID provided
            boolean isManager = SecurityContextUtil.isManager();
            if (isManager) {
                // Case 2: MANAGER role
                courtIds = getCourtIdsManage(null);
            } else {
                // Case 1: ADMIN role
                courtIds = courtClient.getCourtIds().getBody();
            }
        }
        List<Transaction> transactions = transactionService
                .findTransactionsByFilters(paymentStatus, courtIds, orderId,startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Transaction Report");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "Transaction ID", "Order ID", "Payment Status", "Amount", "Bill Code",
                    "FT Code", "Create Date"
            };
            CellStyle headerStyle = createHeaderStyle(workbook);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Create data rows
            CellStyle dateStyle = createDateTimeStyle(workbook);
            int rowNum = 1;
            for (Transaction transaction : transactions) {
                Row row = sheet.createRow(rowNum++);
                int cellNum = 0;

                row.createCell(cellNum++).setCellValue(transaction.getId());
                row.createCell(cellNum++).setCellValue(transaction.getOrder() != null ? transaction.getOrder().getId() : "");
                row.createCell(cellNum++).setCellValue(transaction.getPaymentStatus() != null ? transaction.getPaymentStatus() : "");
                row.createCell(cellNum++).setCellValue(transaction.getAmount() != null ? transaction.getAmount().toString() : "");
                row.createCell(cellNum++).setCellValue(transaction.getBillCode() != null ? transaction.getBillCode() : "");
                row.createCell(cellNum++).setCellValue(transaction.getFtCode() != null ? transaction.getFtCode() : "");

                Cell createDateCell = row.createCell(cellNum++);
                if (transaction.getCreateDate() != null) {
                    createDateCell.setCellValue(transaction.getCreateDate().format(DATE_FORMATTER));
                    createDateCell.setCellStyle(dateStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                workbook.write(out);
                return out.toByteArray();
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel report", e);
        }
    }

    public byte[] generateRevenueReportExcel(RevenueSummaryRequest request) {

        RevenueSummaryResponse revenueSummaryResponse = generateRevenueReport(request);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Revenue Report");
            CellStyle headerStyle = createHeaderStyle(workbook);
            int rowNum = 0;

            // Summary Section
            rowNum = createSummarySection(sheet, revenueSummaryResponse.getSummary(), headerStyle, rowNum);

            // Data Section
            rowNum = createDataSection(sheet, revenueSummaryResponse.getData(), headerStyle, rowNum);

            // Auto-size columns
            for (int i = 0; i < 7; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                workbook.write(out);
                return out.toByteArray();
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel report", e);
        }
    }

    private int createSummarySection(Sheet sheet, RevenueSummary summary, CellStyle headerStyle, int startRow) {
        // Summary Header
        Row summaryHeaderRow = sheet.createRow(startRow++);
        Cell summaryHeaderCell = summaryHeaderRow.createCell(0);
        summaryHeaderCell.setCellValue("Revenue Summary");
        summaryHeaderCell.setCellStyle(headerStyle);

        // Summary Data Headers
        Row summaryDataHeaderRow = sheet.createRow(startRow++);
        String[] headers = { "Total Revenue", "Total Deposit", "Total Refund", "Total Paid" };
        for (int i = 0; i < headers.length; i++) {
            Cell cell = summaryDataHeaderRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Summary Data
        Row summaryDataRow = sheet.createRow(startRow++);
        summaryDataRow.createCell(0).setCellValue(summary.getTotalRevenue().toString());
        summaryDataRow.createCell(1).setCellValue(summary.getTotalDeposit().toString());
        summaryDataRow.createCell(2).setCellValue(summary.getTotalRefund().toString());
        summaryDataRow.createCell(3).setCellValue(summary.getTotalPaid().toString());

        // Add empty row for spacing
        sheet.createRow(startRow++);
        return startRow;
    }

    private int createDataSection(Sheet sheet, List<RevenueData> data, CellStyle headerStyle, int startRow) {
        // Data Header
        Row dataHeaderRow = sheet.createRow(startRow++);
        String[] headers = {
                "Period", "Court ID", "Court Name", "Total Revenue", "Deposit Amount", "Paid Amount", "Refund Amount"
        };
        for (int i = 0; i < headers.length; i++) {
            Cell cell = dataHeaderRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Data Rows
        for (RevenueData rd : data) {
            Row row = sheet.createRow(startRow++);
            int cellNum = 0;
            row.createCell(cellNum++).setCellValue(rd.getPeriod());
            row.createCell(cellNum++).setCellValue(rd.getCourtId());
            row.createCell(cellNum++).setCellValue(rd.getCourtName());
            row.createCell(cellNum++).setCellValue(rd.getTotalRevenue().toString());
            row.createCell(cellNum++).setCellValue(rd.getDepositAmount().toString());
            row.createCell(cellNum++).setCellValue(rd.getPaidAmount().toString());
            row.createCell(cellNum++).setCellValue(rd.getRefundAmount().toString());
        }

        return startRow;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy"));
        return style;
    }

    private CellStyle createDateTimeStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy hh:mm:ss"));
        return style;
    }

}
