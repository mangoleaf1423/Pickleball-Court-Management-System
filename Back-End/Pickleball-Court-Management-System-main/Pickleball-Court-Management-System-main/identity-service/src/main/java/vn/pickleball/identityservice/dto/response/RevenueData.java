package vn.pickleball.identityservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RevenueData {
    private String period;       // "2024-01", "2024-02"
    private String courtId;      // "court1", "court2"
    private String courtName;      // "court1", "court2"
    private BigDecimal totalRevenue;   // Tổng giá trị đơn
    private BigDecimal depositAmount; // Tiền đặt cọc
    private BigDecimal paidAmount;    // amountPaid từ Order
    private BigDecimal refundAmount;  // Tổng hoàn tiền từ Transaction
}
