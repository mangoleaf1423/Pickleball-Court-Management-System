package vn.pickleball.courtservice.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class CourtPriceResponse {
    private String courtId;
    private List<TimeSlotResponse> weekdayTimeSlots; // Khung thời gian cho WEEKDAY
    private List<TimeSlotResponse> weekendTimeSlots; // Khung thời gian cho WEEKEND
}
