package vn.pickleball.identityservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class RevenueSummaryResponse {
    private RevenueSummary summary;
    private List<RevenueData> data;
}