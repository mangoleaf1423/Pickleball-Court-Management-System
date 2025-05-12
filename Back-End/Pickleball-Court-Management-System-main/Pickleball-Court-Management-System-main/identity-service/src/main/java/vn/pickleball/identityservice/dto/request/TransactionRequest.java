package vn.pickleball.identityservice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionRequest {

    private String orderId;
    private String paymentStatus;
    private BigDecimal amount;
    private String billCode;
    private String status;
    private String ftCode;
    private LocalDateTime createDate;
}
