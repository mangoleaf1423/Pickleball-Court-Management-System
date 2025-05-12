package vn.pickleball.identityservice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {

    private String id;

    private String title;

    private String description;

    private String status;

    private LocalDateTime createAt;

    private NotiData notificationData;
}
