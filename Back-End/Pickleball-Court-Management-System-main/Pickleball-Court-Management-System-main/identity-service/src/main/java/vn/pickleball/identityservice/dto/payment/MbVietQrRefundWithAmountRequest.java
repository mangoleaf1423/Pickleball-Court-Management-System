package vn.pickleball.identityservice.dto.payment;

import lombok.*;

@Data
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MbVietQrRefundWithAmountRequest {

        private String billCode;

        private String amount;
}
