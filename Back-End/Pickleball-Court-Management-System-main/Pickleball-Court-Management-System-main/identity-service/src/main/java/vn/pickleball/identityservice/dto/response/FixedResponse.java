package vn.pickleball.identityservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@AllArgsConstructor
public class FixedResponse {
    private String courtSlotName;
    private LocalTime startTime;
    private LocalTime endTime;
    private List<LocalDate> bookingDates;
}
