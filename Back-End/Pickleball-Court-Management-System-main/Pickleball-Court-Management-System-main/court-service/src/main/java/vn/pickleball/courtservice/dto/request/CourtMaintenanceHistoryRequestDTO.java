package vn.pickleball.courtservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CourtMaintenanceHistoryRequestDTO {
    private String id;

    @NotBlank(message = "courtSlotId must be not null")
    private String courtSlotId;

    @NotNull(message = "startTime must be not null")
    private LocalDateTime startTime;

    @NotNull(message = "endTime must be not null")
    private LocalDateTime endTime;
    private LocalDateTime finishAt;
    private String description;
    private String status;
}

