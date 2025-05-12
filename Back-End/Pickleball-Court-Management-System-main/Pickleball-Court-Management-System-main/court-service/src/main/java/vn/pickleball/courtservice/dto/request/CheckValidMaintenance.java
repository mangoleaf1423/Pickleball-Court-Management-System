package vn.pickleball.courtservice.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class CheckValidMaintenance {
    private String courtId;
    private List<LocalDate> bookingDates;
    private LocalTime startTime;
    private LocalTime endTime;
}
