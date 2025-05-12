package vn.pickleball.identityservice.websockethandler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import vn.pickleball.identityservice.dto.payment.NotificationResponse;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;


@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String PENDING_MESSAGES_KEY_PREFIX = "websocket:pending:";
    private final ConcurrentHashMap<String, WebSocketSession> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String key = session.getUri().getQuery().split("=")[1];
        log.info("Connection established for : {}", key);

        sessionMap.put(key, session);

        NotificationResponse message = getPendingMessageFromRedis(key);
        if (message != null) {
            String jsonMessage = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(jsonMessage));
            removePendingMessagesFromRedis(key);
        }

//        List<NotificationResponse> messages = getPendingMessagesFromRedis(key);
//        if (messages != null) {
//            for (NotificationResponse message : messages) {
//                String jsonMessage = objectMapper.writeValueAsString(message);
//                session.sendMessage(new TextMessage(jsonMessage));
//            }
//            removePendingMessagesFromRedis(key);
//        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String key = session.getUri().getQuery().split("=")[1];
        log.info("Disconnected from key: {}", key);

        sessionMap.remove(key);
    }

    public void sendNotification(NotificationResponse message) {
        String key = message.getKey();

        WebSocketSession session = sessionMap.get(key);

        if (session != null && session.isOpen()) {
            String jsonMessage = null;
            try {
                jsonMessage = objectMapper.writeValueAsString(message);

                session.sendMessage(new TextMessage(jsonMessage));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        } else {
            savePendingMessageToRedis(message);
            log.warn("No active session found for key: {}. Message stored for later delivery.", key);
        }
    }

    private void savePendingMessageToRedis(NotificationResponse message) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            redisTemplate.opsForValue().set(PENDING_MESSAGES_KEY_PREFIX + message.getKey(), jsonMessage, 5, TimeUnit.MINUTES);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert message to JSON", e);
        }
    }

    private NotificationResponse getPendingMessageFromRedis(String key) {
        String redisKey = PENDING_MESSAGES_KEY_PREFIX + key;
        String jsonMessage = redisTemplate.opsForValue().get(redisKey);

        if (jsonMessage == null || jsonMessage.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(jsonMessage, NotificationResponse.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse message from JSON", e);
        }
    }

    private List<NotificationResponse> getPendingMessagesFromRedis(String key) {
        List<String> rawMessages = redisTemplate.opsForList().range(PENDING_MESSAGES_KEY_PREFIX + key, 0, -1);
        if (rawMessages == null || rawMessages.isEmpty()) {
            return null;
        }

        List<NotificationResponse> messages = new ArrayList<>();
        for (String rawMessage : rawMessages) {
            try {
                messages.add(objectMapper.readValue(rawMessage, NotificationResponse.class));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to parse message from JSON", e);
            }
        }
        return messages;
    }

    private void removePendingMessagesFromRedis(String key) {
        redisTemplate.delete(PENDING_MESSAGES_KEY_PREFIX + key);
    }
}

