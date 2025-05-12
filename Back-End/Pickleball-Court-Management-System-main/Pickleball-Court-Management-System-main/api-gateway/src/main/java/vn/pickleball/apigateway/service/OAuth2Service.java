package vn.pickleball.apigateway.service;


import com.nimbusds.jwt.SignedJWT;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2Service {

    private static final String REDIS_TOKEN_KEY_FORMAT = "token.key.%s";

    private final RedisTemplate<String, String> redisTemplate;

    @PostConstruct
    public void postConstruct() {
        RedisSerializer<String> stringSerializer = new StringRedisSerializer();
        redisTemplate.setKeySerializer(stringSerializer);
        redisTemplate.setValueSerializer(stringSerializer);
    }

    public boolean checkValid(String accessToken) {
        SignedJWT signedJWT = null;
        String uid;
        try {
            signedJWT = SignedJWT.parse(accessToken);
            log.info("CHECK SESSION");

            uid = String.valueOf(signedJWT.getJWTClaimsSet().getClaim("uid"));

        } catch (ParseException e) {
            throw new RuntimeException(e);
        }

        if (uid == null) {
            return false;
        }
        String redisKey = String.format(REDIS_TOKEN_KEY_FORMAT, uid);
        // Nếu đã là String thì giữ nguyên
        String redisValue = Optional.ofNullable(redisTemplate.opsForValue().get(redisKey))
                .map(String::toString)
                .orElse(null);
        log.info("REDIS: {} - {}", redisKey, redisValue);
        // Kiểm tra token với key là sessionId được lưu trong redis có giống với khi tạo hay không
        return ((redisValue != null) && redisValue.equals(accessToken));
    }

}
