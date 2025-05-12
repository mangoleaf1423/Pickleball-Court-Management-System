package vn.pickleball.identityservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.pickleball.identityservice.dto.request.NotificationRequest;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long totalCount;
    private Long unreadCount;
    private List<NotificationRequest> notifications;
}
