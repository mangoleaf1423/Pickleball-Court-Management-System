package vn.pickleball.identityservice.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import vn.pickleball.identityservice.client.CourtClient;
import vn.pickleball.identityservice.dto.request.CourtMap;
import vn.pickleball.identityservice.dto.request.CourtServiceMap;
import vn.pickleball.identityservice.dto.request.CourtSlotMap;
import vn.pickleball.identityservice.dto.response.OrderData;
import vn.pickleball.identityservice.dto.response.OrderDetailResponse;
import vn.pickleball.identityservice.dto.response.OrderResponse;
import vn.pickleball.identityservice.dto.response.ServiceDetailResponse;
import vn.pickleball.identityservice.entity.BookingDate;
import vn.pickleball.identityservice.entity.Order;
import vn.pickleball.identityservice.entity.OrderDetail;
import vn.pickleball.identityservice.entity.ServiceDetailEntity;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderMapperCustom {
    private final CourtClient courtClient;

    public List<OrderDetailResponse> mapOrderDetailsToResponse(List<OrderDetail> orderDetails, Map<String, CourtSlotMap> courtSlotMap) {
        if (orderDetails == null || orderDetails.isEmpty()) {
            return Collections.emptyList();
        }

        return orderDetails.stream()
                .map(orderDetail -> {
                    // Lấy courtSlotName từ courtSlotMap
                    CourtSlotMap courtSlot = courtSlotMap.get(orderDetail.getCourtSlotId());
                    return new OrderDetailResponse(
                            courtSlot != null ? courtSlot.getCourtSlotName() : null, // courtSlotName
                            orderDetail.getStartTime(), // startTime
                            orderDetail.getEndTime(), // endTime
                            orderDetail.getBookingDates().stream()
                                    .map(BookingDate::getBookingDate)
                                    .collect(Collectors.toList()) // bookingDates
                    );
                })
                .collect(Collectors.toList());
    }

    // Map danh sách ServiceDetailEntity sang ServiceDetailResponse
    public List<ServiceDetailResponse> mapServiceDetailsToResponse(List<ServiceDetailEntity> serviceDetails, Map<String, CourtServiceMap> courtServiceMap) {
        if (serviceDetails == null || serviceDetails.isEmpty()) {
            return Collections.emptyList();
        }

        return serviceDetails.stream()
                .map(serviceDetail -> {
                    // Lấy courtServiceName từ courtServiceMap
                    CourtServiceMap courtService = courtServiceMap.get(serviceDetail.getCourtServiceId());
                    return ServiceDetailResponse.builder()
                            .courtServiceId(serviceDetail.getCourtServiceId())
                            .courtServiceName(courtService != null ? courtService.getName() : null)
                            .quantity(serviceDetail.getQuantity())
                            .price(serviceDetail.getPrice())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // Map một Order sang OrderResponse
    public OrderResponse toOrderResponse(Order order) {
        // Gọi các API để lấy danh sách Court, CourtSlot, CourtService
        ResponseEntity<List<CourtMap>> courtResponse = courtClient.getAllCourts();
        ResponseEntity<List<CourtSlotMap>> courtSlotResponse = courtClient.getCourtSlotMap(order.getCourtId());
        ResponseEntity<List<CourtServiceMap>> courtServiceResponse = courtClient.getServiceMap(order.getCourtId());

        // Tạo map để tra cứu nhanh theo ID
        Map<String, CourtMap> courtMap = courtResponse.getBody().stream()
                .collect(Collectors.toMap(CourtMap::getId, court -> court));
        Map<String, CourtSlotMap> courtSlotMap = courtSlotResponse.getBody().stream()
                .collect(Collectors.toMap(CourtSlotMap::getCourtSlotId, slot -> slot));
        Map<String, CourtServiceMap> courtServiceMap = courtServiceResponse.getBody().stream()
                .collect(Collectors.toMap(CourtServiceMap::getId, service -> service));

        // Lấy thông tin Court từ courtMap
        CourtMap court = courtMap.get(order.getCourtId());

        // Map Order sang OrderResponse
        return OrderResponse.builder()
                .id(order.getId())
                .courtId(order.getCourtId())
                .courtName(court != null ? court.getName() : null)
                .address(court != null ? court.getAddress() : null)
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .customerName(order.getCustomerName())
                .phoneNumber(order.getPhoneNumber())
                .note(order.getNote())
                .orderType(order.getOrderType())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .discountCode(order.getDiscountCode())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .paymentAmount(order.getPaymentAmount())
                .depositAmount(order.getDepositAmount())
                .amountPaid(order.getAmountPaid())
                .amountRefund(order.getAmountRefund())
                .paymentTimeout(order.getPaymentTimeout())
                .qrcode(null)
                .createdAt(order.getCreatedAt())
                .orderDetails(mapOrderDetailsToResponse(order.getOrderDetails(), courtSlotMap)) // Sử dụng hàm map mới
                .serviceDetails(mapServiceDetailsToResponse(order.getServiceDetails(), courtServiceMap)) // Sử dụng hàm map mới
                .build();
    }

    // Map danh sách Orders sang danh sách OrderResponses
    public List<OrderResponse> toOrderResponses(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return Collections.emptyList();
        }

        // Gọi API để lấy toàn bộ danh sách Court
        ResponseEntity<List<CourtMap>> courtResponse = courtClient.getAllCourts();
        List<CourtMap> courts = courtResponse.getBody();

        // Lấy danh sách courtId duy nhất từ orders
        List<String> courtIds = orders.stream()
                .map(Order::getCourtId)
                .distinct()
                .collect(Collectors.toList());

        // Gọi API CourtSlot và CourtService cho từng courtId
        Map<String, List<CourtSlotMap>> courtSlotMaps = courtIds.stream()
                .collect(Collectors.toMap(
                        courtId -> courtId,
                        courtId -> courtClient.getCourtSlotMap(courtId).getBody()
                ));

        Map<String, List<CourtServiceMap>> courtServiceMaps = courtIds.stream()
                .collect(Collectors.toMap(
                        courtId -> courtId,
                        courtId -> courtClient.getServiceMap(courtId).getBody()
                ));

        // Tạo map để tra cứu nhanh theo ID
        Map<String, CourtMap> courtMap = courts.stream()
                .collect(Collectors.toMap(CourtMap::getId, court -> court));

        // Map từng Order sang OrderResponse
        return orders.stream().map(order -> {
            // Lấy thông tin Court từ courtMap
            CourtMap court = courtMap.get(order.getCourtId());

            // Lấy danh sách CourtSlot và CourtService tương ứng với courtId
            List<CourtSlotMap> courtSlots = courtSlotMaps.getOrDefault(order.getCourtId(), Collections.emptyList());
            List<CourtServiceMap> courtServices = courtServiceMaps.getOrDefault(order.getCourtId(), Collections.emptyList());

            // Tạo map để tra cứu nhanh CourtSlot và CourtService
            Map<String, CourtSlotMap> courtSlotMap = courtSlots.stream()
                    .collect(Collectors.toMap(CourtSlotMap::getCourtSlotId, slot -> slot));
            Map<String, CourtServiceMap> courtServiceMap = courtServices.stream()
                    .collect(Collectors.toMap(CourtServiceMap::getId, service -> service));

            // Map Order sang OrderResponse
            return OrderResponse.builder()
                    .id(order.getId())
                    .courtId(order.getCourtId())
                    .courtName(court != null ? court.getName() : null)
                    .address(court != null ? court.getAddress() : null)
                    .userId(order.getUser() != null ? order.getUser().getId() : null)
                    .customerName(order.getCustomerName())
                    .phoneNumber(order.getPhoneNumber())
                    .note(order.getNote())
                    .orderType(order.getOrderType())
                    .orderStatus(order.getOrderStatus())
                    .paymentStatus(order.getPaymentStatus())
                    .discountCode(order.getDiscountCode())
                    .totalAmount(order.getTotalAmount())
                    .discountAmount(order.getDiscountAmount())
                    .paymentAmount(order.getPaymentAmount())
                    .depositAmount(order.getDepositAmount())
                    .amountPaid(order.getAmountPaid())
                    .amountRefund(order.getAmountRefund())
                    .paymentTimeout(order.getPaymentTimeout())
                    .qrcode(null)
                    .createdAt(order.getCreatedAt())
                    .orderDetails(mapOrderDetailsToResponse(order.getOrderDetails(), courtSlotMap)) // Sử dụng hàm map mới
                    .serviceDetails(mapServiceDetailsToResponse(order.getServiceDetails(), courtServiceMap)) // Sử dụng hàm map mới
                    .build();
        }).collect(Collectors.toList());
    }

    public List<OrderData> toOrderDataList(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, CourtMap> courtMap = courtClient.getAllCourts().getBody().stream()
                .collect(Collectors.toMap(CourtMap::getId, court -> court));

        return orders.stream()
                .map(order -> {
                    // Lấy thông tin Court từ courtMap
                    CourtMap court = courtMap.get(order.getCourtId());

                    // Tạo OrderData
                    OrderData orderData = new OrderData();
                    orderData.setId(order.getId());
                    orderData.setCourtId(order.getCourtId());
                    orderData.setCourtName(court != null ? court.getName() : null);
                    orderData.setAddress(court != null ? court.getAddress() : null);
                    orderData.setUserId(order.getUser() != null ? order.getUser().getId() : null);
                    orderData.setCustomerName(order.getCustomerName());
                    orderData.setPhoneNumber(order.getPhoneNumber());
                    orderData.setNote(order.getNote());
                    orderData.setOrderType(order.getOrderType());
                    orderData.setOrderStatus(order.getOrderStatus());
                    orderData.setPaymentStatus(order.getPaymentStatus());
                    orderData.setDiscountCode(order.getDiscountCode());
                    orderData.setTotalAmount(order.getTotalAmount());
                    orderData.setDiscountAmount(order.getDiscountAmount());
                    orderData.setPaymentAmount(order.getPaymentAmount());
                    orderData.setAmountPaid(order.getAmountPaid());
                    orderData.setAmountRefund(order.getAmountRefund());
                    orderData.setCreatedAt(order.getCreatedAt());

                    return orderData;
                })
                .collect(Collectors.toList());
    }
}
