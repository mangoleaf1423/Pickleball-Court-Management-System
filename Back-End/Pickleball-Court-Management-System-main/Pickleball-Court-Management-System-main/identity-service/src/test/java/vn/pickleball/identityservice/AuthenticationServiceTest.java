package vn.pickleball.identityservice;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import vn.pickleball.identityservice.dto.request.AuthenticationRequest;
import vn.pickleball.identityservice.dto.request.IntrospectRequest;
import vn.pickleball.identityservice.dto.request.LogoutRequest;
import vn.pickleball.identityservice.dto.request.RefreshRequest;
import vn.pickleball.identityservice.dto.response.AuthenticationResponse;
import vn.pickleball.identityservice.dto.response.IntrospectResponse;
import vn.pickleball.identityservice.entity.Role;
import vn.pickleball.identityservice.entity.User;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.exception.AppException;
import vn.pickleball.identityservice.exception.ErrorCode;
import vn.pickleball.identityservice.service.AuthenticationService;
import vn.pickleball.identityservice.service.UserService;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @InjectMocks
    private AuthenticationService authenticationService;

    @Mock
    private UserService userService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private String signerKey = "secret-key-for-jwt-signing-must-be-32-bytes-long";
    private long validDuration = 3600; // 1 hour in seconds
    private long refreshableDuration = 604800; // 7 days in seconds
    private User user;

    @BeforeEach
    void setUp() throws Exception {
        // Set up reflection to inject @Value fields
        java.lang.reflect.Field signerKeyField = AuthenticationService.class.getDeclaredField("SIGNER_KEY");
        signerKeyField.setAccessible(true);
        signerKeyField.set(authenticationService, signerKey);

        java.lang.reflect.Field validDurationField = AuthenticationService.class.getDeclaredField("VALID_DURATION");
        validDurationField.setAccessible(true);
        validDurationField.set(authenticationService, validDuration);

        java.lang.reflect.Field refreshableDurationField = AuthenticationService.class.getDeclaredField("REFRESHABLE_DURATION");
        refreshableDurationField.setAccessible(true);
        refreshableDurationField.set(authenticationService, refreshableDuration);

        // Set up a default user
        user = new User();
        user.setId("user123");
        user.setUsername("testuser");
        user.setPassword(new BCryptPasswordEncoder().encode("password123"));
        Set<Role> roles = new HashSet<>();
        Role role = new Role();
        role.setName("USER");
        roles.add(role);
        user.setRoles(roles);
    }

    @Test
    void authenticate_validCredentials_success() throws Exception {
        // Arrange
        AuthenticationRequest request = new AuthenticationRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        when(userService.findByUsernameOrEmailOrPhoneNumber("testuser")).thenReturn(user);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // Act
        AuthenticationResponse response = authenticationService.authenticate(request);

        // Assert
        assertNotNull(response);
        assertTrue(response.isAuthenticated());
        assertNotNull(response.getToken());
        verify(userService).findByUsernameOrEmailOrPhoneNumber("testuser");
        verify(valueOperations).set(eq("token.key.user123"), anyString(), eq(validDuration), eq(TimeUnit.SECONDS));
    }

    @Test
    void authenticate_invalidCredentials_throwsException() {
        // Arrange
        AuthenticationRequest request = new AuthenticationRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpassword");
        when(userService.findByUsernameOrEmailOrPhoneNumber("testuser")).thenReturn(user);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> authenticationService.authenticate(request));
        assertEquals(ErrorCode.LOGIN_FAIL, exception.getErrorCode());
        verify(userService).findByUsernameOrEmailOrPhoneNumber("testuser");
        verifyNoInteractions(redisTemplate);
    }

    @Test
    void authenticate_userNotFound_throwsException() {
        // Arrange
        AuthenticationRequest request = new AuthenticationRequest();
        request.setUsername("nonexistent");
        request.setPassword("password123");
        when(userService.findByUsernameOrEmailOrPhoneNumber("nonexistent"))
                .thenThrow(new AppException(ErrorCode.USER_NOT_EXISTED));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> authenticationService.authenticate(request));
        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
        verify(userService).findByUsernameOrEmailOrPhoneNumber("nonexistent");
        verifyNoInteractions(redisTemplate);
    }

    @Test
    void introspect_validToken_success() throws Exception {
        // Arrange
        String token = createValidToken(user, false);
        IntrospectRequest request = new IntrospectRequest();
        request.setToken(token);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("token.key.user123")).thenReturn(token);

        // Act
        IntrospectResponse response = authenticationService.introspect(request);

        // Assert
        assertTrue(response.isValid());
        verify(valueOperations).get("token.key.user123");
    }


    @Test
    void introspect_expiredToken_throwsException() throws Exception {
        // Arrange
        String token = createExpiredToken(user, false);
        IntrospectRequest request = new IntrospectRequest();
        request.setToken(token);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("token.key.user123")).thenReturn(token);

        // Act
        IntrospectResponse response = authenticationService.introspect(request);

        // Assert
        assertFalse(response.isValid());
        verify(valueOperations).get("token.key.user123");
        verify(redisTemplate).delete("token.key.user123");
    }


    @Test
    void logout_invalidToken_throwsException() {
        // Arrange
        LogoutRequest request = new LogoutRequest();
        request.setToken("invalid-token");

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> authenticationService.logout(request));
        assertEquals(ErrorCode.UNAUTHENTICATED, exception.getErrorCode());
        verifyNoInteractions(redisTemplate);
    }

    @Test
    void refreshToken_validToken_success() throws Exception {
        // Arrange
        String token = createValidToken(user, false);
        RefreshRequest request = new RefreshRequest();
        request.setToken(token);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("token.key.user123")).thenReturn(token);
        when(userService.findByUsername("testuser")).thenReturn(user);

        // Act
        AuthenticationResponse response = authenticationService.refreshToken(request);

        // Assert
        assertNotNull(response);
        assertTrue(response.isAuthenticated());
        assertNotNull(response.getToken());
        verify(valueOperations).get("token.key.user123");
        verify(userService).findByUsername("testuser");
        verify(valueOperations).set(eq("token.key.user123"), anyString(), eq(validDuration), eq(TimeUnit.SECONDS));
    }

    @Test
    void refreshToken_refreshToken_throwsException() throws Exception {
        // Arrange
        String token = createValidToken(user, true);
        RefreshRequest request = new RefreshRequest();
        request.setToken(token);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> authenticationService.refreshToken(request));
        assertEquals(ErrorCode.UNAUTHENTICATED, exception.getErrorCode());
        verifyNoInteractions(redisTemplate, userService);
    }

    private String createValidToken(User user, boolean isRefresh) throws Exception {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256); // Changed to HS256
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("hyperlogy.com")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(validDuration, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", "ROLE_USER")
                .claim("uid", user.getId())
                .claim("isRefresh", isRefresh)
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);
        jwsObject.sign(new MACSigner(signerKey.getBytes()));
        return jwsObject.serialize();
    }

    // Helper method to create an expired JWT token
    private String createExpiredToken(User user, boolean isRefresh) throws Exception {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256); // Changed to HS256
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("hyperlogy.com")
                .issueTime(new Date(Instant.now().minus(2 * validDuration, ChronoUnit.SECONDS).toEpochMilli()))
                .expirationTime(new Date(Instant.now().minus(validDuration, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", "ROLE_USER")
                .claim("uid", user.getId())
                .claim("isRefresh", isRefresh)
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);
        jwsObject.sign(new MACSigner(signerKey.getBytes()));
        return jwsObject.serialize();
    }
}