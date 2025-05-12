package vn.pickleball.courtservice.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CourtServiceMap {
    private String id;
    private String name;
}
