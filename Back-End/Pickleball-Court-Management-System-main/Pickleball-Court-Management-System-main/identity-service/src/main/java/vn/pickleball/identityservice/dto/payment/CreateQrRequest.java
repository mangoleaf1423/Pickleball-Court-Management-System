package vn.pickleball.identityservice.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateQrRequest {
    private String billCode;
    private Double amount;
    private String signature;
}
