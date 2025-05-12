package vn.pickleball.identityservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.pickleball.identityservice.dto.request.AnalysisDetail;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyAnalysisResponse {
    private int totalSlots;
    private int bookedSlots;
    private double occupancyRate;

    private List<AnalysisDetail> analysisDetails;


}
