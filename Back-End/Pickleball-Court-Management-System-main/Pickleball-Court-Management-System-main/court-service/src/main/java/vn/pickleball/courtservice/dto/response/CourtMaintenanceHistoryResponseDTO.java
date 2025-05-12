package vn.pickleball.courtservice.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CourtMaintenanceHistoryResponseDTO {
    private String id;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime finishAt;
    private String description;
    private String status;
}

