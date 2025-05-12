package vn.pickleball.identityservice.dto.payment;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationData {
    private String traceTransfer;

    private String storeLabel;

    private String terminalLabel;

    private String debitAmount;
    private String realAmount;
    private String payDate;
    private String respCode;
    private String respDesc;

    private String checkSum;

    private String billNumber;

    private String referenceLabelCode;

    private String referenceLabelTime;

    private String ftCode;
}
