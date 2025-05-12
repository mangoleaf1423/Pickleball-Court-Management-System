package vn.pickleball.courtservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourtServicePurchaseRequest {
    @NotBlank(message = "ServiceId must be not null")
    private String id;           // ID của dịch vụ

    @NotNull(message = "Quantity mustbe not null")
    private Integer quantity;  // Số lượng khách mua
}

