package vn.pickleball.identityservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
public class PaymentData {
    private String paymentType;
    private String status;
    private String id;
    private String billCode;
    private String ftCode;
    private String terminalId;
}
