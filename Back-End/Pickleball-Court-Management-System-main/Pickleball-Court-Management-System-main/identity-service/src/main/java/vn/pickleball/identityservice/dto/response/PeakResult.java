package vn.pickleball.identityservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PeakResult {
    private LocalDate date;

    private String dayOfWeek;

    private String timeRange;

    private int bookingCount;

    private double occupancyRate;
}
