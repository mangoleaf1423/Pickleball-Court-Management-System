package vn.pickleball.identityservice.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class OrderRequest {
    @NotBlank(message = "Court ID is required")
    private String courtId;

    private String userId;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone number must be 10 or 11 digits")
    private String phoneNumber;

    private String note;

//    @NotBlank(message = "Order type is required")
    private String orderType;

    private String discountCode;

    @DecimalMin(value = "0.0", inclusive = false, message = "Total amount must be greater than zero")
    private BigDecimal totalAmount;

    private BigDecimal discountAmount;

    private BigDecimal paymentAmount;

    private BigDecimal amountPaid;

    @DecimalMin(value = "0.0", inclusive = false, message = "Deposit amount cannot be negative")
    private BigDecimal depositAmount;

    @Pattern(regexp = "^(Chưa đặt cọc|Chưa thanh toán|Đã thanh toán|Đã đặt cọc)$", message = "Payment status must be one of: Chưa đặt cọc || Chưa thanh toán||Đã thanh toán|Đã đặt cọc")
    private String paymentStatus;

    @NotBlank(message = "Signature is required")
    private String signature;

    @NotEmpty(message = "Order details cannot be empty")
    private List<OrderDetailRequest> orderDetails;
}
