package vn.pickleball.identityservice.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import vn.pickleball.identityservice.dto.AnalysisType;

@Data
public class OccupancyAnalysisRequest {

    private String courtId;

    @NotNull
    private DateRange dateRange;

    @NotNull
    private AnalysisType analysisType;
}
