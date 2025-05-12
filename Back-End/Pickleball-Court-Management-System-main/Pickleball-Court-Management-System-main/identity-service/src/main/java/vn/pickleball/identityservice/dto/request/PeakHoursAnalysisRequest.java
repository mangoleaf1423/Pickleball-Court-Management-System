package vn.pickleball.identityservice.dto.request;

import lombok.Data;
import vn.pickleball.identityservice.dto.AnalysisTarget;

@Data
public class PeakHoursAnalysisRequest {
    private String courtId;

    private DateRange dateRange;

    private AnalysisTarget analysisTarget;

    private Integer topCount = 3;
}