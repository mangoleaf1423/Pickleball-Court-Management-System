package vn.pickleball.identityservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RevenueSummary {
    private BigDecimal totalRevenue;  // = totalPaid - totalRefund
    private BigDecimal totalDeposit; // Tổng tiền đặt cọc
    private BigDecimal totalRefund;  // Tổng tiền hoàn
    private BigDecimal totalPaid;    // Tổng amountPaid từ Order
}

