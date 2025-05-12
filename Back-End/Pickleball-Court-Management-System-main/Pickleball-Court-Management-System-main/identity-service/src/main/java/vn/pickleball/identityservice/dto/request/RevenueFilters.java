package vn.pickleball.identityservice.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class RevenueFilters {
    private List<String> orderStatus;
    private List<String> paymentStatus;
    private List<String> courtIds;
    private List<String> orderTypes;
}
