package vn.pickleball.courtservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CourtSlotRequest {
    private String id;

    @NotBlank(message = "CourtId must be not null")
    private String courtId;

    @NotBlank(message = "Name must be not null")
    private String name;
    private boolean isActive;
}
