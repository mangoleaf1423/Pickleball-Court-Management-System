package vn.pickleball.identityservice.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ServiceDetailRequest {
    @NotBlank(message = "courtServiceId must be not null")
    private String courtServiceId;

    @NotNull(message = "quantity must be not null")
    private int quantity;

    @DecimalMin(value = "0.0", message = "Price amount cannot be negative")
    private BigDecimal price;
}
