package vn.pickleball.courtservice.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CourtSlotMap {
    private String courtSlotId;
    private String courtSlotName;
}
