package vn.pickleball.identityservice.dto.response;

import lombok.Data;

@Data
public class PaymentInformation {
    private String orderId;
    private String billcode;
    private double amount;
    private String qrcode;
}
