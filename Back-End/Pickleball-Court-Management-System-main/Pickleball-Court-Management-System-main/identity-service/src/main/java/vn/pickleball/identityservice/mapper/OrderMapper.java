package vn.pickleball.identityservice.mapper;

import org.hibernate.Hibernate;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Autowired;
import vn.pickleball.identityservice.dto.BookingStatus;
import vn.pickleball.identityservice.dto.request.*;
import vn.pickleball.identityservice.dto.response.*;
import vn.pickleball.identityservice.entity.*;
import vn.pickleball.identityservice.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring" , imports = BookingStatus.class, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderMapper {
    OrderMapper INSTANCE = Mappers.getMapper(OrderMapper.class);

    @Mapping(target = "id", ignore = true) // ID được tạo tự động
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "orderDetails", ignore = true) // Sẽ map riêng
    @Mapping(target = "paymentStatus", constant = "Chưa đặt cọc")
    @Mapping(target = "orderStatus", constant = "Đang xử lý")
    @Mapping(target = "amountPaid", ignore = true)
    Order toOrderEntity(OrderRequest request);


    @Mapping(target = "id", ignore = true) // ID được tạo tự động
    @Mapping(target = "order", ignore = true) // Liên kết sau khi ánh xạ
    @Mapping(target = "bookingDates", ignore = true) // Sẽ map riêng
    OrderDetail toOrderDetail(OrderDetailDto dto);

    @Mapping(target = "id", ignore = true) // ID được tạo tự động
    @Mapping(source = "bookingDate", target = "bookingDate")
    BookingDate toBookingDate(LocalDate bookingDate);

    @Mapping(target = "id", ignore = true) // Không thay đổi ID
    @Mapping(target = "user", ignore = true) // Giữ nguyên User
    @Mapping(target = "orderDetails", ignore = true) // Xử lý riêng trong after mapping
    @Mapping(target = "transactions", ignore = true) // Giữ nguyên transactions nếu có
    void updateOrderFromRequest(OrderRequest request, @MappingTarget Order order);

    @AfterMapping
    default void mapOrderDetails(@MappingTarget Order order, OrderRequest request) {
        // Không xóa ở đây nữa, sẽ xử lý trong service
        if (order.getOrderDetails() == null) {
            order.setOrderDetails(new ArrayList<>());
        }

        // Chỉ thêm mới OrderDetail từ request
        if (request.getOrderDetails() != null) {
            for (OrderDetailRequest detailRequest : request.getOrderDetails()) {
                LocalDate bookingDate = detailRequest.getBookingDate();
                if (detailRequest.getBookingSlots() != null) {
                    for (OrderDetailDto slot : detailRequest.getBookingSlots()) {
                        OrderDetail orderDetail = toOrderDetail(slot);
                        orderDetail.setOrder(order);

                        BookingDate bookingDateEntity = toBookingDate(bookingDate);
                        bookingDateEntity.setOrderDetail(orderDetail);

                        if (orderDetail.getBookingDates() == null) {
                            orderDetail.setBookingDates(new ArrayList<>());
                        }
                        orderDetail.getBookingDates().add(bookingDateEntity);

                        order.getOrderDetails().add(orderDetail);
                    }
                }
            }
        }
    }

//    default List<OrderDetailRequest> mapOrderDetails(List<OrderDetail> orderDetails) {
//        if (orderDetails == null || orderDetails.isEmpty()) {
//            return Collections.emptyList();
//        }
//
//        Map<LocalDate, List<OrderDetailDto>> groupedByDate = orderDetails.stream()
//                .flatMap(orderDetail -> orderDetail.getBookingDates().stream()
//                        .map(bookingDate -> new AbstractMap.SimpleEntry<>(bookingDate.getBookingDate(),
//                                new OrderDetailDto(
//                                        orderDetail.getCourtSlotId(),
//                                        ,
//                                        orderDetail.getStartTime(),
//                                        orderDetail.getEndTime(),
//                                        orderDetail.getPrice()
//                                )
//                        ))
//                )
//                .collect(Collectors.groupingBy(Map.Entry::getKey,
//                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
//
//        return groupedByDate.entrySet().stream()
//                .map(entry -> {
//                    OrderDetailRequest request = new OrderDetailRequest();
//                    request.setBookingDate(entry.getKey());
//                    request.setBookingSlots(entry.getValue());
//                    return request;
//                })
//                .collect(Collectors.toList());
//    }

//    @Mapping(source = "id", target = "id")
//    @Mapping(target = "userId", source = "user.id")
//    @Mapping(target = "createdAt", source = "createdAt")
//    @Mapping(target = "orderDetails", expression = "java(shouldMapOrderDetails(order) ? mapOrderDetailsToResponse(order.getOrderDetails()) : null)")
//    @Mapping(target = "serviceDetails", expression = "java(shouldMapServiceDetails(order) ? mapServiceDetailsToResponse(order.getServiceDetails()) : null)")
//    OrderResponse toOrderResponse(Order order);
//
//    default boolean shouldMapOrderDetails(Order order) {
//        return order.getOrderType() != null && !order.getOrderType().equalsIgnoreCase("Đơn dịch vụ");
//    }
//
//    default boolean shouldMapServiceDetails(Order order) {
//        return order.getOrderType() != null && order.getOrderType().equalsIgnoreCase("Đơn dịch vụ");
//    }
//
//    default List<OrderDetailResponse> mapOrderDetailsToResponse(List<OrderDetail> orderDetails) {
//        if (orderDetails == null || orderDetails.isEmpty()) {
//            return Collections.emptyList();
//        }
//
//        return orderDetails.stream()
//                .map(orderDetail -> new OrderDetailResponse(
//                        orderDetail.getCourtSlotName(),
//                        orderDetail.getStartTime(),
//                        orderDetail.getEndTime(),
//                        orderDetail.getBookingDates().stream()
//                                .map(BookingDate::getBookingDate)
//                                .collect(Collectors.toList())
//                ))
//                .collect(Collectors.toList());
//    }
//
//    default List<ServiceDetailResponse> mapServiceDetailsToResponse(List<ServiceDetailEntity> serviceDetails) {
//        if (serviceDetails == null || serviceDetails.isEmpty()) {
//            return Collections.emptyList();
//        }
//
//        return serviceDetails.stream()
//                .map(serviceDetail -> ServiceDetailResponse.builder()
//                        .courtServiceId(serviceDetail.getCourtServiceId())
//                        .courtServiceName(serviceDetail.getCourtServiceName())
//                        .quantity(serviceDetail.getQuantity())
//                        .price(serviceDetail.getPrice())
//                        .build())
//                .collect(Collectors.toList());
//    }
//
//    List<OrderResponse> toOrderResponses(List<Order> orders);
//
//    @Mapping(source = "id", target = "id")
//    @Mapping(target = "userId", source = "user.id")
//    @Mapping(target = "createdAt", source = "createdAt")
//    OrderData toOrderData(Order order);
//
//    List<OrderData> toDatas(List<Order> orders);

    @Mapping(target = "courtId", source = "courtId")
    @Mapping(target = "dateBooking", source = "orderDetail.bookingDate")
    @Mapping(target = "status", expression = "java(BookingStatus.BOOKED)")
    @Mapping(target = "courtSlotBookings", source = "orderDetail.bookingSlots", qualifiedByName = "mapCourtSlotBookings")
    UpdateBookingSlot toUpdateBookingSlot(String courtId, OrderDetailRequest orderDetail);

    @Named("mapCourtSlotBookings")
    default Map<String, List<LocalTime>> mapCourtSlotBookings(List<OrderDetailDto> bookingSlots) {
        if (bookingSlots == null) {
            return new HashMap<>();
        }

        return bookingSlots.stream()
                .collect(Collectors.toMap(
                        OrderDetailDto::getCourtSlotId,
                        slot -> splitTimeSlots(slot.getStartTime(), slot.getEndTime()),
                        (existing, replacement) -> {
                            existing.addAll(replacement);
                            return existing;
                        }
                ));
    }

    default List<LocalTime> splitTimeSlots(LocalTime startTime, LocalTime endTime) {
        List<LocalTime> slots = new ArrayList<>();
        LocalTime current = startTime;

        while (current.isBefore(endTime)) {
            slots.add(current);
            current = current.plusMinutes(30);
        }

        return slots;
    }

    default List<UpdateBookingSlot> toUpdateBookingSlotList(OrderRequest orderRequest) {
        return orderRequest.getOrderDetails().stream()
                .map(orderDetail -> toUpdateBookingSlot(orderRequest.getCourtId(), orderDetail))
                .collect(Collectors.toList());
    }

    default List<UpdateBookingSlot> orderToUpdateBookingSlotList(List<Order> orders) {
        return orders.stream()
                .flatMap(order -> orderToUpdateBookingSlot(order).stream())
                .collect(Collectors.toList());
    }

    default List<UpdateBookingSlot> orderToUpdateBookingSlot(Order order) {
        if (order == null || order.getOrderDetails() == null) {
            return Collections.emptyList();
        }

        Map<LocalDate, UpdateBookingSlot> bookingSlotMap = new HashMap<>();

        for (OrderDetail orderDetail : order.getOrderDetails()) {
            for (BookingDate bookingDate : orderDetail.getBookingDates()) {
                LocalDate dateBooking = bookingDate.getBookingDate();

                // Lấy hoặc tạo mới UpdateBookingSlot theo ngày booking
                UpdateBookingSlot updateBookingSlot = bookingSlotMap.computeIfAbsent(dateBooking, date -> {
                    UpdateBookingSlot slot = new UpdateBookingSlot();
                    slot.setCourtId(order.getCourtId());
                    slot.setDateBooking(date);
                    slot.setStatus(BookingStatus.BOOKED);
                    slot.setCourtSlotBookings(new HashMap<>());
                    return slot;
                });

                // Chia các khoảng thời gian 30 phút
                List<LocalTime> timeSlots = splitTimeSlots(orderDetail.getStartTime(), orderDetail.getEndTime());

                // Thêm vào courtSlotBookings
                updateBookingSlot.getCourtSlotBookings()
                        .computeIfAbsent(orderDetail.getCourtSlotId(), k -> new ArrayList<>())
                        .addAll(timeSlots);
            }
        }

        return new ArrayList<>(bookingSlotMap.values());
    }

    default UpdateBookingSlot mapToUpdateBookingSlot(List<Order> orders, LocalDate bookingDate) {
        if (orders == null || orders.isEmpty()) {
            return null;
        }

        // Tạo một đối tượng UpdateBookingSlot duy nhất
        UpdateBookingSlot updateBookingSlot = new UpdateBookingSlot();
        updateBookingSlot.setDateBooking(bookingDate);
        updateBookingSlot.setStatus(BookingStatus.BOOKED);

        // Duyệt qua các order để lấy courtId
        updateBookingSlot.setCourtId(orders.get(0).getCourtId());

        // Map courtSlotBookings từ orderDetails
        Map<String, List<LocalTime>> courtSlotBookings = new HashMap<>();

        for (Order order : orders) {
            for (OrderDetail orderDetail : order.getOrderDetails()) {
                // Chia các khoảng thời gian 30 phút
                List<LocalTime> timeSlots = splitTimeSlots(orderDetail.getStartTime(), orderDetail.getEndTime());

                // Nhóm theo courtSlotName
                courtSlotBookings
                        .computeIfAbsent(orderDetail.getCourtSlotId(), k -> new ArrayList<>())
                        .addAll(timeSlots);
            }
        }

        updateBookingSlot.setCourtSlotBookings(courtSlotBookings);
        return updateBookingSlot;
    }

    @Mapping(target = "orderStatus", constant = "Đặt dịch vụ tại sân")
    @Mapping(target = "paymentStatus", constant = "Chưa thanh toán")
    @Mapping(target = "orderType", constant = "Đơn dịch vụ")
    @Mapping(target = "orderDetails", ignore = true)
    @Mapping(target = "serviceDetails", ignore = true)
    @Mapping(target = "transactions", ignore = true)
    @Mapping(target = "user", ignore = true)
    Order toOrderService(OrderServiceRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "order", ignore = true)
    ServiceDetailEntity toServiceDetailEntity(ServiceDetailRequest request);

    @Mapping(target = "id" , source = "courtServiceId")
    @Mapping(target = "quantity" , source = "quantity")
    CourtServicePurchaseRequest toPurchaseRequest(ServiceDetailEntity entity);

    List<CourtServicePurchaseRequest> toPurchaseRequestList(List<ServiceDetailEntity> entities);

//    @Mapping(target = "fixedOrderDetails", source = "fixedOrderDetails")
//    @Mapping(target = "flexibleOrderDetails", source = "flexibleOrderDetails")
//    @Mapping(target = "totalAmount", source = "order.paymentAmount")
//    @Mapping(target = "paymentAmount", source = "order.paymentAmount")
//    @Mapping(target = "depositAmount", source = "order.depositAmount")
//    @Mapping(target = "paymentTimeout", source = "order.paymentTimeout")
//    OrderResponse mapFixedToOrderResponse(Order order, List<OrderDetail> fixedOrderDetails, List<OrderDetail> flexibleOrderDetails);
//
//    List<FixedResponse> mapOrderFixedDetails(List<OrderDetail> orderDetails);
//
//    // Optionally add a method for mapping BookingDate to LocalDate if needed
//    default List<LocalDate> mapBookingDates(List<BookingDate> bookingDates) {
//        if (bookingDates == null) {
//            return Collections.emptyList();
//        }
//        return bookingDates.stream()
//                .map(BookingDate::getBookingDate)
//                .collect(Collectors.toList());
//    }

    // =========================================

////    @Mapping(target = "paymentStatus", constant = "Chưa đặt cọc")
////    @Mapping(target = "orderStatus", constant = "Đang xử lý")
////    @Mapping(target = "amountPaid", ignore = true)
////    Order toEntity(OrderRequest request);
//
//    @Mapping(source = "id", target = "id")
//    @Mapping(target = "userId", source = "user.id")
//    @Mapping(target = "createdAt", source = "createdAt")
//    OrderResponse toResponse(Order order);
//
//    List<OrderDetail> toEntity(List<OrderDetailRequest> orderDetails);
//
//    List<OrderDetailResponse> toResponse(List<OrderDetail> orderDetails);
//
//    OrderDetail toEntity(OrderDetailRequest request);
//
//    OrderDetailResponse toResponse(OrderDetail orderDetail);
//

//
//    List<OrderResponse> toResponseList(List<Order> orders);
//
//
////    @Mapping(target = "courtId", source = "courtId")
////    @Mapping(target = "dateBooking", source = "bookingDate")
////    @Mapping(target = "status", expression = "java(BookingStatus.BOOKED)")
////    @Mapping(target = "courtSlotBookings", expression = "java(mapCourtSlotBookings(orderRequest.getOrderDetails()))")
////    UpdateBookingSlot toUpdateBookingSlot(OrderRequest orderRequest);
//
//    @Mapping(target = "courtId", source = "courtId")
//    @Mapping(target = "dateBooking", source = "bookingDate")
//    @Mapping(target = "status", ignore = true)
//    @Mapping(target = "courtSlotBookings", expression = "java(mapCourtSlotBookingsV2(order.getOrderDetails()))")
//    UpdateBookingSlot orderToUpdateBookingSlot(Order order);
//
//
////    default Map<String, List<LocalTime>> mapCourtSlotBookings(List<OrderDetailRequest> orderDetails) {
////        if (orderDetails == null || orderDetails.isEmpty()) {
////            return Collections.emptyMap();
////        }
////
////        Map<String, List<LocalTime>> courtSlotBookings = new HashMap<>();
////
////        for (OrderDetailRequest detail : orderDetails) {
////            List<LocalTime> timeSlots = splitTimeSlots(detail.getStartTime(), detail.getEndTime());
////            courtSlotBookings.computeIfAbsent(detail.getCourtSlotName(), k -> new ArrayList<>()).addAll(timeSlots);
////        }
////
////        return courtSlotBookings;
////    }
//
//
//    @Named("mapCourtSlotBookingsV2")
//    default Map<String, List<LocalTime>> mapCourtSlotBookingsV2(List<OrderDetail> orderDetails) {
//        if (orderDetails == null || orderDetails.isEmpty()) {
//            return Collections.emptyMap();
//        }
//        Map<String, List<LocalTime>> courtSlotBookings = new HashMap<>();
//        for (OrderDetail detail : orderDetails) {
//            List<LocalTime> timeSlots = splitTimeSlots(detail.getStartTime(), detail.getEndTime());
//            courtSlotBookings.computeIfAbsent(detail.getCourtSlotName(), k -> new ArrayList<>()).addAll(timeSlots);
//        }
//        return courtSlotBookings;
//    }
//
////    @Mapping(target = "courtId", source = "courtId")
////    @Mapping(target = "dateBooking", source = "bookingDate")
////    @Mapping(target = "status", expression = "java(BookingStatus.BOOKED)")
////    @Mapping(target = "courtSlotBookings", expression = "java(mapCourtSlotBookingsFromOrders(orders))")
////    UpdateBookingSlot ordersToUpdateBookingSlot(List<Order> orders, LocalDate bookingDate , String courtId);
//
//    default Map<String, List<LocalTime>> mapCourtSlotBookingsFromOrders(List<Order> orders) {
//        Map<String, List<LocalTime>> courtSlotBookings = new HashMap<>();
//
//        for (Order order : orders) {
//            if (order.getOrderDetails() != null) {
//                for (OrderDetail detail : order.getOrderDetails()) {
//                    List<LocalTime> timeSlots = splitTimeSlots(detail.getStartTime(), detail.getEndTime());
//                    courtSlotBookings.computeIfAbsent(detail.getCourtSlotName(), k -> new ArrayList<>()).addAll(timeSlots);
//                }
//            }
//        }
//        return courtSlotBookings;
//    }

}
