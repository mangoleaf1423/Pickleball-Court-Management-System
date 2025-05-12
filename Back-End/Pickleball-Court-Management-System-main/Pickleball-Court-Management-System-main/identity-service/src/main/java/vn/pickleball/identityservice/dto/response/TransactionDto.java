package vn.pickleball.identityservice.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionDto {
    private String id;
    private String paymentStatus;
    private BigDecimal amount;
    private String billCode;
    private String ftCode;
    private LocalDateTime createDate;
}