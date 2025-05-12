package vn.pickleball.courtservice.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class TimeSlotResponse {
    private String id;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal regularPrice;
    private BigDecimal dailyPrice;
    private BigDecimal studentPrice;
}
