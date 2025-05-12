package vn.pickleball.identityservice.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CourtPriceResponse {
    private String courtId;
    private List<CourtTimeSlot> weekdayTimeSlots;
    private List<CourtTimeSlot> weekendTimeSlots;

    @Data
    public static class CourtTimeSlot {
        private String id;
        private String startTime;
        private String endTime;
        private BigDecimal regularPrice;
        private BigDecimal dailyPrice;
        private BigDecimal studentPrice;
    }
}