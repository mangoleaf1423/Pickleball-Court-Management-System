package vn.pickleball.courtservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import vn.pickleball.courtservice.entity.CourtPrice;
import vn.pickleball.courtservice.entity.CourtSlot;
import vn.pickleball.courtservice.entity.TimeSlot;
import vn.pickleball.courtservice.exception.ApiException;
import vn.pickleball.courtservice.dto.BookingStatus;
import vn.pickleball.courtservice.dto.WeekType;
import vn.pickleball.courtservice.dto.request.UpdateBookingSlot;
import vn.pickleball.courtservice.dto.response.BookingSlotResponse;
import vn.pickleball.courtservice.dto.response.CourtSlotBookingResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BookingSlotService {

    private final CourtSlotService courtSlotService;

    private final CourtPriceService courtPriceService;

    private final TimeSlotService timeSlotService;

    private final RedisTemplate<String, Object> redisTemplate;

    private final ObjectMapper objectMapper;

    private final RestTemplate restTemplate;

    private final RedisTemplate<String, String> redisString;

    private static final String REDIS_KEY_PREFIX = "booking_slots:";

    public List<CourtSlotBookingResponse> getBookingSlots(String courtId, LocalDate dateBooking) {
        String redisKey = REDIS_KEY_PREFIX + courtId + ":" + dateBooking.toString();

        // Kiểm tra trong Redis
        List<CourtSlotBookingResponse> cachedSlots = (List<CourtSlotBookingResponse>) redisTemplate.opsForValue().get(redisKey);
        if (cachedSlots != null) {
            return cachedSlots;
        }

        // Lấy tất cả CourtSlot theo courtId
        List<CourtSlot> courtSlots = courtSlotService.findByCourtIdOrderByCreatedAtAsc(courtId);

        // Lấy tất cả CourtPrice của courtId
        List<CourtPrice> courtPrices = courtPriceService.getByCourtId(courtId);

        // Kiểm tra xem có bao nhiêu loại weekType
        boolean hasMultipleWeekTypes = courtPrices.stream()
                .map(CourtPrice::getWeekType)
                .distinct()
                .count() > 1;

        // Xác định weekType dựa trên ngày được chọn (nếu có nhiều loại weekType)
        WeekType selectedWeekType = WeekType.NONE;
        if (hasMultipleWeekTypes) {
            selectedWeekType = determineWeekType(dateBooking);
        }

        // Tạo danh sách CourtSlotBookingResponse
        List<CourtSlotBookingResponse> bookingSlotsByCourtSlot = new ArrayList<>();
        List<TimeSlot> timeSlots = timeSlotService.findByCourtIdOrderByStartTimeAsc(courtId);

        for (CourtSlot courtSlot : courtSlots) {
            // Tạo danh sách BookingSlotResponse cho từng CourtSlot
            List<BookingSlotResponse> bookingSlots = new ArrayList<>();

            for (TimeSlot timeSlot : timeSlots) {
                // Lấy CourtPrice tương ứng với TimeSlot
                CourtPrice courtPrice = courtPrices.stream()
                        .filter(cp -> cp.getTimeSlot().getId().equals(timeSlot.getId()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("CourtPrice not found for TimeSlot: " + timeSlot.getId()));

                // Kiểm tra weekType (nếu có nhiều loại)
                if (hasMultipleWeekTypes && courtPrice.getWeekType() != selectedWeekType) {
                    continue; // Bỏ qua nếu weekType không khớp
                }

                // Chia nhỏ TimeSlot thành các khoảng thời gian nhỏ hơn
                List<BookingSlotResponse> splitSlots = splitTimeSlot(timeSlot, dateBooking, courtPrice);

                // Thêm vào danh sách
                bookingSlots.addAll(splitSlots);
            }

            // Tạo CourtSlotBookingResponse
            CourtSlotBookingResponse courtSlotBookingResponse = new CourtSlotBookingResponse();
            courtSlotBookingResponse.setCourtSlotId(courtSlot.getId());
            courtSlotBookingResponse.setCourtSlotName(courtSlot.getName());
            courtSlotBookingResponse.setBookingSlots(bookingSlots);

            // Thêm vào kết quả
            bookingSlotsByCourtSlot.add(courtSlotBookingResponse);
        }
        this.lockSlotsByMaintenance(bookingSlotsByCourtSlot,courtId,dateBooking);
        this.synchronousBooked(bookingSlotsByCourtSlot,courtId,dateBooking);
        // Tính thời gian hết hạn cho Redis (24h của ngày được chọn trừ cho ngày hiện tại)
        long expireTime = calculateExpireTime(dateBooking);
        if(expireTime > 0) {
            // Lưu vào Redis với thời gian hết hạn
            redisTemplate.opsForValue().set(redisKey, bookingSlotsByCourtSlot, expireTime, TimeUnit.SECONDS);
        }
        return bookingSlotsByCourtSlot;
    }

    private WeekType determineWeekType(LocalDate dateBooking) {
        DayOfWeek dayOfWeek = dateBooking.getDayOfWeek();
        return (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) ? WeekType.WEEKEND : WeekType.WEEKDAY;
    }

    private List<BookingSlotResponse> splitTimeSlot(TimeSlot timeSlot, LocalDate dateBooking, CourtPrice courtPrice) {
        List<BookingSlotResponse> splitSlots = new ArrayList<>();

        LocalTime startTime = timeSlot.getStartTime();
        LocalTime endTime = timeSlot.getEndTime();

        // Chia thành các khoảng thời gian 30 phút
        while (startTime.isBefore(endTime)) {
            LocalTime slotEndTime = startTime.plusMinutes(30);
            if (slotEndTime.isAfter(endTime)) {
                slotEndTime = endTime;
            }

            // Tạo BookingSlotResponse
            BookingSlotResponse slotResponse = new BookingSlotResponse();
            slotResponse.setStartTime(startTime);
            slotResponse.setEndTime(slotEndTime);
            slotResponse.setRegularPrice(courtPrice.getRegularPrice()); // Giá từ CourtPrice
            slotResponse.setDailyPrice(courtPrice.getDailyPrice());
            slotResponse.setStudentPrice(courtPrice.getStudentPrice());

            if (slotResponse.getEndTime().isBefore(LocalTime.now()) && !dateBooking.isAfter(LocalDate.now())) {
                slotResponse.setStatus(BookingStatus.LOCKED);
            }else {
                slotResponse.setStatus(BookingStatus.AVAILABLE);
            }
            splitSlots.add(slotResponse);

            // Cập nhật startTime cho vòng lặp tiếp theo
            startTime = slotEndTime;
        }

        return splitSlots;
    }

    private void synchronousBooked (List<CourtSlotBookingResponse> bookingSlotsByCourtSlot, String courtId, LocalDate bookingDate){
        UpdateBookingSlot updateBookingSlot = this.getBookedSlots(courtId,bookingDate);
        if(updateBookingSlot == null) return;
        // Duyệt qua từng courtSlotId và cập nhật trạng thái
        for (Map.Entry<String, List<LocalTime>> entry : updateBookingSlot.getCourtSlotBookings().entrySet()) {
            String courtSlotId = entry.getKey();
            List<LocalTime> startTimes = entry.getValue();

            // Tìm CourtSlotBookingResponse tương ứng với courtSlotId
            CourtSlotBookingResponse courtSlotBookingResponse = bookingSlotsByCourtSlot.stream()
                    .filter(response -> response.getCourtSlotId().equals(courtSlotId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy courtSlotName trong Redis: " + courtSlotId));

            // Cập nhật trạng thái của các khung giờ được đặt
            List<BookingSlotResponse> bookingSlots = courtSlotBookingResponse.getBookingSlots();
            for (BookingSlotResponse slot : bookingSlots) {
                if (startTimes.contains(slot.getStartTime())) {
                    slot.setStatus(BookingStatus.BOOKED);
                }
            }
        }
    }


    private long calculateExpireTime(LocalDate dateBooking) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endOfDay = dateBooking.atTime(23, 59, 59);
        return Duration.between(now, endOfDay).getSeconds();
    }

    public List<CourtSlotBookingResponse> getBookingSlotsRedis(String courtId, LocalDate dateBooking) {
        String redisKey = REDIS_KEY_PREFIX + courtId + ":" + dateBooking.toString();

        // Lấy dữ liệu từ Redis
        Object cachedData = redisTemplate.opsForValue().get(redisKey);
        if (cachedData == null) {
            throw new RuntimeException("Không tìm thấy thông tin booking slot trong Redis");
        }

        // Chuyển đổi dữ liệu từ Redis thành List<CourtSlotBookingResponse>
        List<CourtSlotBookingResponse> cachedSlots = objectMapper.convertValue(cachedData, new TypeReference<List<CourtSlotBookingResponse>>() {});

        return cachedSlots;
    }

    public void updateBookingSlotsInRedis(String courtId, LocalDate dateBooking, BookingStatus status, Map<String, List<LocalTime>> courtSlotBookings) {
        String redisKey = REDIS_KEY_PREFIX + courtId + ":" + dateBooking.toString();

        // Lấy dữ liệu từ Redis
        Object cachedData = redisTemplate.opsForValue().get(redisKey);
        if (cachedData == null) {
            throw new RuntimeException("Không tìm thấy thông tin booking slot trong Redis");
        }

        // Chuyển đổi dữ liệu từ Redis thành List<CourtSlotBookingResponse>
        List<CourtSlotBookingResponse> cachedSlots = objectMapper.convertValue(cachedData, new TypeReference<List<CourtSlotBookingResponse>>() {});

        // Duyệt qua từng courtSlotId và cập nhật trạng thái
        for (Map.Entry<String, List<LocalTime>> entry : courtSlotBookings.entrySet()) {
            String courtSlotId = entry.getKey();
            List<LocalTime> startTimes = entry.getValue();

            // Tìm CourtSlotBookingResponse tương ứng với courtSlotId
            CourtSlotBookingResponse courtSlotBookingResponse = cachedSlots.stream()
                    .filter(response -> response.getCourtSlotId().equals(courtSlotId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy courtSlotName trong Redis: " + courtSlotId));

            // Cập nhật trạng thái của các khung giờ được đặt
            List<BookingSlotResponse> bookingSlots = courtSlotBookingResponse.getBookingSlots();
            for (BookingSlotResponse slot : bookingSlots) {
                if (startTimes.contains(slot.getStartTime())) {
                    if(status.equals(BookingStatus.BOOKED) && !slot.getStatus().equals(BookingStatus.AVAILABLE)){
                        throw new ApiException("slot not available", "INVALID_SLOT");
                    }
                    slot.setStatus(status);
                }else if (slot.getEndTime().isBefore(LocalTime.now()) && !dateBooking.isAfter(LocalDate.now())) {
                    slot.setStatus(BookingStatus.LOCKED);
                }
            }
        }

        // Lưu lại vào Redis
        redisTemplate.opsForValue().set(redisKey, cachedSlots);
    }

    public UpdateBookingSlot getBookedSlots(String courtId, LocalDate bookingDate) {
//        String url = UriComponentsBuilder.fromHttpUrl("http://localhost:8081/identity/public/booked-slots")
        String url = UriComponentsBuilder.fromHttpUrl("http://203.145.46.242:8080/api/identity/public/booked-slots")
                .queryParam("courtId", courtId)
                .queryParam("bookingDate", bookingDate)
                .toUriString();

        ResponseEntity<UpdateBookingSlot> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );

        return response.getBody();
    }

    public void deleteBookingSlotsByCourtId(String courtId) {
        String pattern = REDIS_KEY_PREFIX + courtId + ":*";

        Set<String> keysToDelete = redisTemplate.keys(pattern);

        if (keysToDelete != null && !keysToDelete.isEmpty()) {
            redisTemplate.delete(keysToDelete);
        }
    }

    public void lockSlotsByMaintenance(List<CourtSlotBookingResponse> courtSlotBookingResponses, String courtId, LocalDate date) {
        for (CourtSlotBookingResponse courtSlotBooking : courtSlotBookingResponses) {
            String courtSlotId = courtSlotBooking.getCourtSlotId();
            String key = String.format("maintenance:%s:%s:%s", courtId, courtSlotId, date);
            String maintenanceTimeRange = redisString.opsForValue().get(key);

            if (maintenanceTimeRange != null && maintenanceTimeRange.contains(" - ")) {
                String[] timeRange = maintenanceTimeRange.split(" - ");
                LocalTime maintenanceStartTime = LocalTime.parse(timeRange[0]);
                LocalTime maintenanceEndTime = LocalTime.parse(timeRange[1]);

                for (BookingSlotResponse slot : courtSlotBooking.getBookingSlots()) {
                    LocalTime slotStartTime = slot.getStartTime();
                    LocalTime slotEndTime = slot.getEndTime();

                    if ((slotStartTime.equals(maintenanceStartTime) || slotStartTime.isAfter(maintenanceStartTime))
                            && slotStartTime.isBefore(maintenanceEndTime)) {
                        slot.setStatus(BookingStatus.LOCKED);
                    }
                }
            }
        }
    }


}