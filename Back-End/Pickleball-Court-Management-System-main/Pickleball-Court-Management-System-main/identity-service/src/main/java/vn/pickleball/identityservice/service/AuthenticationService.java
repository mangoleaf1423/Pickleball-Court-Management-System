package vn.pickleball.identityservice.service;


import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;

import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import vn.pickleball.identityservice.dto.request.AuthenticationRequest;
import vn.pickleball.identityservice.dto.request.IntrospectRequest;
import vn.pickleball.identityservice.dto.request.LogoutRequest;
import vn.pickleball.identityservice.dto.request.RefreshRequest;
import vn.pickleball.identityservice.dto.response.AuthenticationResponse;
import vn.pickleball.identityservice.dto.response.IntrospectResponse;
import vn.pickleball.identityservice.entity.User;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.exception.AppException;
import vn.pickleball.identityservice.exception.ErrorCode;
import vn.pickleball.identityservice.repository.UserRepository;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserService userService;
    private final RedisTemplate<String, String> redisTemplate;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY; // String -> byte[]

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

    private static final String REDIS_TOKEN_KEY_FORMAT = "token.key.%s";

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token, false);
        } catch (AppException e) {
            isValid = false;
        }

        return IntrospectResponse.builder().valid(isValid).build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        User user = userService.findByUsernameOrEmailOrPhoneNumber(request.getUsername());

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) throw new AppException(ErrorCode.LOGIN_FAIL);

        var token = generateToken(user, false);

        return AuthenticationResponse.builder().token(token).authenticated(true).build();
    }

    public void logout(LogoutRequest request) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(request.getToken());
            String uid = signedJWT.getJWTClaimsSet().getClaim("uid").toString();

            deleteRedisToken(uid);
        } catch (ParseException e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {

        SignedJWT signedJWT = SignedJWT.parse(request.getToken());

        var isRefresh = signedJWT.getJWTClaimsSet().getClaim("isRefresh");
        if (isRefresh.toString().equals("true")) throw new AppException(ErrorCode.UNAUTHENTICATED);

        verifyToken(request.getToken(), true);


        var username = signedJWT.getJWTClaimsSet().getSubject();

        var user = userService.findByUsername(username);

        var token = generateToken(user , true);


        return AuthenticationResponse.builder().token(token).authenticated(true).build();
    }

    public String generateToken(User user , boolean isRefreshToken) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);

        String uid = user.getId();

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("hyperlogy.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .claim("uid", uid)
                .claim("isRefresh", isRefreshToken)
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {

            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            String token = jwsObject.serialize();
            saveRedisToken(uid, token);
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new ApiException("Cannot create token", "TOKEN_ERROR");
        }
    }

    private void verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {

        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        String uid = signedJWT.getJWTClaimsSet().getClaim("uid").toString();
        String redis_token = redisTemplate.opsForValue().get(String.format(REDIS_TOKEN_KEY_FORMAT, uid));

        if ((!token.equals(redis_token))) throw new AppException(ErrorCode.UNAUTHENTICATED);

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT
                        .getJWTClaimsSet()
                        .getIssueTime()
                        .toInstant()
                        .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS)
                        .toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!(verified && expiryTime.after(new Date()))) {
            deleteRedisToken(uid);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");

        if (!CollectionUtils.isEmpty(user.getRoles()))
            user.getRoles().forEach(role -> {
                stringJoiner.add("ROLE_" + role.getName());
            });

        return stringJoiner.toString();
    }

    private void saveRedisToken (String key, String token){
        String redisKey = String.format(REDIS_TOKEN_KEY_FORMAT, key);
        redisTemplate.opsForValue().set(redisKey, token, VALID_DURATION, TimeUnit.SECONDS);
    }

    private void deleteRedisToken(String key) {
        String redisKey = String.format(REDIS_TOKEN_KEY_FORMAT, key);
        redisTemplate.delete(redisKey);
    }

}
