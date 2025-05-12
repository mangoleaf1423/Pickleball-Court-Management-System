package vn.pickleball.courtservice.dto.response;

import lombok.Data;

@Data
public class CourtSlotResponse {
    private String id;
    private String courtId;
    private String name;
    private boolean isActive;
}

