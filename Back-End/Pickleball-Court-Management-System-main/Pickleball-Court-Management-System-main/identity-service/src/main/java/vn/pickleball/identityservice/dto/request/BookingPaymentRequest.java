package vn.pickleball.identityservice.dto.request;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class BookingPaymentRequest {
    private String courtId; // Id của sân
    private List<LocalDate> bookingDates;
    private LocalTime startTime;
    private LocalTime endTime;
}
