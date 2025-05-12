package vn.pickleball.courtservice.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class CourtSlotBookingResponse {
    private String courtSlotId;
    private String courtSlotName;// ID của CourtSlot
    private List<BookingSlotResponse> bookingSlots; // Danh sách BookingSlotResponse
}