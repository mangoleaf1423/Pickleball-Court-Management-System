package vn.pickleball.courtservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CourtPriceRequest {
    @NotBlank(message = "CourtId must be not null")
    private String courtId;
    private List<TimeSlotRequest> weekdayTimeSlots; // Khung thời gian cho WEEKDAY
    private List<TimeSlotRequest> weekendTimeSlots; // Khung thời gian cho WEEKEND
}
