package vn.pickleball.identityservice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisDetail {
    private String dayOfWeek;

    private String timeRange;

    private int totalSlots;

    private int bookedSlots;
    private double occupancyRate;
}
