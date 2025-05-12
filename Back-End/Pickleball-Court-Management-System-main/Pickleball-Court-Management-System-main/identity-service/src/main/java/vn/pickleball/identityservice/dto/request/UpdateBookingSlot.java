package vn.pickleball.identityservice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.pickleball.identityservice.dto.BookingStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBookingSlot {
    private String courtId;
    private LocalDate dateBooking;
    private BookingStatus status;
    private Map<String, List<LocalTime>> courtSlotBookings;
}
