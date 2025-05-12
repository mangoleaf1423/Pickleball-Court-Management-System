package vn.pickleball.identityservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
public class ServiceDetailResponse {
    private String courtServiceId;
    private String courtServiceName;
    private int quantity;
    private BigDecimal price;
}
