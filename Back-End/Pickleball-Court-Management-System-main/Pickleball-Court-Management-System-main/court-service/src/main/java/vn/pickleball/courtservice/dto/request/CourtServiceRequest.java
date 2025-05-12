package vn.pickleball.courtservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourtServiceRequest {
    private String id;

    @NotBlank(message = "CourtId must be not null")
    private String courtId;

    @NotBlank(message = "category must be not null")
    private String category;

    @NotBlank(message = "name must be not null")
    private String name;

    @NotNull(message = "price must be not null")
    private Double price;

    @NotNull(message = "quantity must be not null")
    private Integer quantity;

    @NotBlank(message = "unit must be not null")
    private String unit;
    private String description;
    private String imageUrl;
    private boolean isActive;
    private Integer soldCount;
}
