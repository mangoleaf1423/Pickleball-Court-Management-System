package vn.pickleball.identityservice.dto.payment;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder()
@AllArgsConstructor
@NoArgsConstructor
public class NotificationResponse {
    private String key;
    private String resCode;
    private String resDesc;
    private NotificationData data;
}

