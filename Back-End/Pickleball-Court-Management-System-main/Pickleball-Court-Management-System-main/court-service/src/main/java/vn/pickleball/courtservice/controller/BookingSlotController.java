package vn.pickleball.courtservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.pickleball.courtservice.dto.response.CourtSlotBookingResponse;
import vn.pickleball.courtservice.service.BookingSlotService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/booking-slots")
@RequiredArgsConstructor
public class BookingSlotController {

    private final BookingSlotService bookingSlotService;

    @GetMapping
    public ResponseEntity<List<CourtSlotBookingResponse>> getBookingSlots(
            @RequestParam String courtId,
            @RequestParam LocalDate dateBooking
    ) {
        List<CourtSlotBookingResponse> bookingSlots = bookingSlotService.getBookingSlots(courtId, dateBooking);
        return ResponseEntity.ok(bookingSlots);
    }
}