package vn.pickleball.identityservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import vn.pickleball.identityservice.dto.request.NotiData;
import vn.pickleball.identityservice.dto.request.NotificationRequest;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@EnableAsync
public class FCMService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper ;

    public void saveFcmToken(String key, String token) {
        redisTemplate.opsForSet().add("fcm_tokens:" + key, token);
        redisTemplate.expire(key, Duration.ofDays(1));
    }

    public List<String> getTokens(String key) {
        Set<String> tokens = redisTemplate.opsForSet().members("fcm_tokens:" + key);
        return (tokens == null || tokens.isEmpty()) ? null : new ArrayList<>(tokens);
    }

    @Async
    public void sendNotification(List<String> tokenFCMs, NotificationRequest request) {
        try {
            if(tokenFCMs == null || tokenFCMs.isEmpty()) return;

            Notification notification = Notification.builder()
                    .setTitle(request.getTitle())
                    .setBody(request.getDescription())
                    .build();

            MulticastMessage message = MulticastMessage.builder()
                    .setNotification(notification)
                    .putAllData(convertDataToString(request.getNotificationData()))
                    .addAllTokens(tokenFCMs)
                    .build();

            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);

            log.info("Successfully sent messages: " + response.getSuccessCount());
            if (response.getFailureCount() > 0) {
                response.getResponses().stream()
                        .filter(r -> !r.isSuccessful())
                        .forEach(r -> log.error("Failed to send message: ", r.getException()));
            }
        } catch (Exception e) {
            log.error("send fcm error: {}", e.getMessage());
        }
    }

    private Map<String, String> convertDataToString(NotiData data) {
        if (data == null) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.convertValue(data, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            log.error("Error converting notification data: ", e);
            return Collections.emptyMap();
        }
    }
}
