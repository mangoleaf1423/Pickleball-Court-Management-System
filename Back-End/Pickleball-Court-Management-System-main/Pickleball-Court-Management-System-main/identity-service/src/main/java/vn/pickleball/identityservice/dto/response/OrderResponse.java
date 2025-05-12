package vn.pickleball.identityservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.pickleball.identityservice.dto.request.OrderDetailRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private String id;
    private String courtId;
    private String courtName;
    private String address;
    private String userId;
    private String customerName;
    private String phoneNumber;
    private String note;
    private String orderType;
    private String orderStatus;
    private String paymentStatus;
    private String discountCode;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal paymentAmount;
    private BigDecimal depositAmount;
    private BigDecimal amountPaid;
    private BigDecimal amountRefund;
    private LocalDateTime paymentTimeout;
    private List<OrderDetailResponse> orderDetails;
    private List<ServiceDetailResponse> serviceDetails;
    private String qrcode;
    private LocalDateTime createdAt;
}
