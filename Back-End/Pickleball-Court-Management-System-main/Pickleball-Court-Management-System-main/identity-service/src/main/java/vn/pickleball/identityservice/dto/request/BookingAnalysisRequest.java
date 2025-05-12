package vn.pickleball.identityservice.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class BookingAnalysisRequest {
    private List<String> courtIds; // (Optional) Nếu null => phân tích tất cả sân
    private DateRange dateRange;
    private Integer timeSlotDuration; // (Optional, default: 60 phút)
    private String analysisType;
}
