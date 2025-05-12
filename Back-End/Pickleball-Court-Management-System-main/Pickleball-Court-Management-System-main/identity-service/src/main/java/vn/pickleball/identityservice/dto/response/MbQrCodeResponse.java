package vn.pickleball.identityservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MbQrCodeResponse {
    private String code;
    private String desc;
    private String billCode;
    private String qrCode;
}
