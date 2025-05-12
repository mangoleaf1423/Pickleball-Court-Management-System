package vn.pickleball.identityservice.dto.notification;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationData {
    private String title;

    private String message;

}
