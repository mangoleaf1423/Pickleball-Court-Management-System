package vn.pickleball.identityservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class TransactionResponse {
    private List<TransactionDto> transactions;
    private int totalPages;
    private long totalElements;
    private BigDecimal totalAmount;
    private BigDecimal refundAmount;
    private BigDecimal netAmount;
}