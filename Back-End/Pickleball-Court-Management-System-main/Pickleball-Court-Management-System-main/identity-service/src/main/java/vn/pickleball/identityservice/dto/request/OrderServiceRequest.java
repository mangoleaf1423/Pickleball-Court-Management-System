package vn.pickleball.identityservice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderServiceRequest {
    @NotBlank(message = "Court ID is required")
    private String courtId;

    private String customerName;

    private String phoneNumber;

    private String userId;

    private String orderStatus;

    private String note;

    @DecimalMin(value = "0.0", inclusive = false, message = "Payment amount must be greater than zero")
    private BigDecimal paymentAmount;


    @NotEmpty(message = "Order details cannot be empty")
    private List<ServiceDetailRequest> serviceDetails;
}
