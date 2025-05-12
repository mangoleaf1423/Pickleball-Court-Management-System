package vn.pickleball.identityservice.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionHistory {
    private String paymentStatus;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createDate;

}
