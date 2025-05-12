package vn.pickleball.identityservice.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class RevenueSummaryRequest {
    private DateRange dateRange;
    private List<String> groupBy;
    private RevenueFilters filters;
}
