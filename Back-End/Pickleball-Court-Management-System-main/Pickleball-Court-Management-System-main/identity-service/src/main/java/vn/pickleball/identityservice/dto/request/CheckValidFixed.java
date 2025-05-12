package vn.pickleball.identityservice.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CheckValidFixed {
    private String courtId;
    private String daysOfWeek; // "MONDAY,TUESDAY"
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime startTime;
    private LocalTime endTime;
}
