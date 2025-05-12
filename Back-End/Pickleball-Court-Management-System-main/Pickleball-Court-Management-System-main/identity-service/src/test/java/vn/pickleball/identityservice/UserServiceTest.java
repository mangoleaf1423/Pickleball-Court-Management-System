package vn.pickleball.identityservice;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.identityservice.client.CourtClient;
import vn.pickleball.identityservice.constant.PredefinedRole;
import vn.pickleball.identityservice.dto.Gender;
import vn.pickleball.identityservice.dto.request.ChangePasswordRequest;
import vn.pickleball.identityservice.dto.request.UserCreationRequest;
import vn.pickleball.identityservice.dto.request.UserUpdateRequest;
import vn.pickleball.identityservice.dto.response.UserResponse;
import vn.pickleball.identityservice.entity.Role;
import vn.pickleball.identityservice.entity.User;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.exception.AppException;
import vn.pickleball.identityservice.exception.ErrorCode;
import vn.pickleball.identityservice.mapper.UserMapper;
import vn.pickleball.identityservice.repository.UserRepository;
import vn.pickleball.identityservice.service.*;
import vn.pickleball.identityservice.websockethandler.NotificationWebSocketHandler;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleService roleService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private EmailService emailService;

    @Mock
    private CourtClient courtClient;

    @Mock
    private CourtStaffService courtStaffService;

    @Mock
    private NotificationWebSocketHandler socketHandler;

    @Mock
    private RedisTemplate<String, UserCreationRequest> redisUserTemplate;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ValueOperations<String, UserCreationRequest> valueOperations;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
        reset(restTemplate);
    }

    @Test
    void createUser_success() {
        // Arrange
        UserCreationRequest request = new UserCreationRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        request.setEmail("test@example.com");
        request.setPhoneNumber("0123456789");
        User user = new User();
        user.setUsername("testuser");
        UserResponse userResponse = new UserResponse();
        userResponse.setUsername("testuser");
        HashSet<Role> roles = new HashSet<>();
        when(userMapper.toUserEntity(request)).thenReturn(user);
        when(roleService.getRole(PredefinedRole.USER_ROLE)).thenReturn(roles);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toUserResponse(user)).thenReturn(userResponse);

        // Act
        UserResponse result = userService.createUser(request);

        // Assert
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository).save(user);
        verify(userMapper).toUserResponse(user);
        assertTrue(user.isActive());
        assertEquals(roles, user.getRoles());
        verifyNoInteractions(restTemplate); // Ensure no RestTemplate calls
    }

    @Test
    void createUser_userExisted_throwsException() {
        // Arrange
        UserCreationRequest request = new UserCreationRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        request.setEmail("test@example.com");
        request.setPhoneNumber("0123456789");
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setDob(LocalDate.of(2000, 1, 1));
        request.setGender(Gender.MALE);
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPhoneNumber("0123456789");
        when(userMapper.toUserEntity(request)).thenReturn(user);
        when(roleService.getRole(PredefinedRole.USER_ROLE)).thenReturn(new HashSet<>());
        when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("Duplicate entry"));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> userService.createUser(request));
        assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());
        verify(userRepository).save(user);
        verifyNoInteractions(restTemplate); // Ensure no RestTemplate calls
    }

    @Test
    void registerStudent_validEduEmail_success() {
        // Arrange
        UserCreationRequest request = new UserCreationRequest();
        request.setEmail("test@fpt.edu.vn");
        request.setPhoneNumber("0123456789");
        request.setFirstName("John");
        request.setLastName("Doe");
        when(redisUserTemplate.opsForValue()).thenReturn(valueOperations);

        // Act
        String result = userService.registerStudent(request);

        // Assert
        assertEquals("0123456789", result);
        verify(valueOperations).set(eq("USER:0123456789"), eq(request), eq(Duration.ofHours(1)));
        verify(emailService).sendRegistrationConfirmationEmail("test@fpt.edu.vn", "0123456789", "JohnDoe");
        verifyNoInteractions(restTemplate);
    }

    @Test
    void registerStudent_invalidEduEmail_throwsException() {
        // Arrange
        UserCreationRequest request = new UserCreationRequest();
        request.setEmail("test@gmail.com");

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> userService.registerStudent(request));
        assertEquals("INVALID_EMAIL", exception.getErrorCode());
        assertEquals("Email must be student email (.edu.vn)", exception.getMessage());
        verifyNoInteractions(redisUserTemplate, emailService, restTemplate);
    }

    @Test
    void forgetPass_userExists_success() {
        // Arrange
        String key = "testuser";
        User user = new User();
        user.setEmail("test@edu.vn");
        when(userRepository.findByUsernameOrEmailOrPhoneNumber(key)).thenReturn(Optional.of(user));

        // Act
        userService.forgetPass(key);

        // Assert
        verify(userRepository).save(user);
        verify(emailService).sendNewPasswordEmail(eq("test@edu.vn"), anyString());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void forgetPass_userNotExists_throwsException() {
        // Arrange
        String key = "nonexistent";
        when(userRepository.findByUsernameOrEmailOrPhoneNumber(key)).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> userService.forgetPass(key));
        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
        verifyNoInteractions(emailService, restTemplate);
    }

    @Test
    void forgetPass_noEmail_throwsException() {
        // Arrange
        String key = "testuser";
        User user = new User();
        user.setEmail(null);
        when(userRepository.findByUsernameOrEmailOrPhoneNumber(key)).thenReturn(Optional.of(user));

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> userService.forgetPass(key));
        assertEquals("NO_EMAIL", exception.getErrorCode());
        assertEquals("Account not have email", exception.getMessage());
        verifyNoInteractions(emailService, restTemplate);
    }

    @Test
    void confirmRegisterStudent_validRequest_success() {
        // Arrange
        String phoneNumber = "0123456789";
        UserCreationRequest request = new UserCreationRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        User user = new User();
        UserResponse userResponse = new UserResponse();
        when(redisUserTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("USER:" + phoneNumber)).thenReturn(request);
        when(userMapper.toUserEntity(request)).thenReturn(user);
        when(roleService.getRole("STUDENT")).thenReturn(new HashSet<>());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toUserResponse(user)).thenReturn(userResponse);

        // Act
        UserResponse result = userService.confirmRegisterStudent(phoneNumber);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(user);
        verify(userMapper).toUserResponse(user);
        assertTrue(user.isActive());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void confirmRegisterStudent_expiredRequest_throwsException() {
        // Arrange
        String phoneNumber = "0123456789";
        when(redisUserTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("USER:" + phoneNumber)).thenReturn(null);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> userService.confirmRegisterStudent(phoneNumber));
        assertEquals("INVALID_CONFIRM", exception.getErrorCode());
        assertEquals("Confirmation email is expired", exception.getMessage());
        verifyNoInteractions(userRepository, userMapper, restTemplate);
    }

    @Test
    void getMyInfo_success() {
        // Arrange
        String username = "testuser";
        User user = new User();
        user.setUsername(username);
        UserResponse userResponse = new UserResponse();
        userResponse.setUsername(username);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userMapper.toUserResponse(user)).thenReturn(userResponse);

        // Act
        UserResponse result = userService.getMyInfo();

        // Assert
        assertNotNull(result);
        assertEquals(username, result.getUsername());
        verify(userRepository).findByUsername(username);
        verify(userMapper).toUserResponse(user);
        verifyNoInteractions(restTemplate);
    }

    @Test
    void getMyInfo_userNotExists_throwsException() {
        // Arrange
        String username = "nonexistent";
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> userService.getMyInfo());
        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
        verify(userRepository).findByUsername(username);
        verifyNoInteractions(userMapper, restTemplate);
    }

    @Test
    void changePassword_validCredentials_success() {
        // Arrange
        String username = "testuser";
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setPassword("oldPass");
        request.setNewPassword("newPass");
        User user = new User();
        user.setPassword(new BCryptPasswordEncoder().encode("oldPass"));
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        // Act
        userService.changePassword(request);

        // Assert
        verify(userRepository).save(user);
        verify(userRepository).findByUsername(username);
        verifyNoInteractions(restTemplate);
    }

    @Test
    void changePassword_invalidCurrentPassword_throwsException() {
        // Arrange
        String username = "testuser";
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setPassword("wrongPass");
        request.setNewPassword("newPass");
        User user = new User();
        user.setPassword(new BCryptPasswordEncoder().encode("oldPass"));
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> userService.changePassword(request));
        assertEquals("FAIL_PASS", exception.getErrorCode());
        assertEquals("Current pass incorrect", exception.getMessage());
        verify(userRepository).findByUsername(username);
        verify(userRepository, never()).save(any());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void updateUser_success() {
        // Arrange
        String username = "testuser";
        UserUpdateRequest request = new UserUpdateRequest();
        User user = new User();
        user.setUsername(username);
        UserResponse userResponse = new UserResponse();
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toUserResponse(user)).thenReturn(userResponse);

        // Act
        UserResponse result = userService.updateUser(request);

        // Assert
        assertNotNull(result);
        verify(userMapper).updateUser(user, request);
        verify(userRepository).save(user);
        verify(userMapper).toUserResponse(user);
        verifyNoInteractions(restTemplate);
    }

//    @Test
//    void updateAvatar_validImage_success() throws IOException {
//        // Arrange
//        String username = "testuser";
//        MultipartFile file = mock(MultipartFile.class);
//        User user = new User();
//        user.setUsername(username);
//        user.setAvatar("oldAvatar.jpg");
//        when(securityContext.getAuthentication()).thenReturn(authentication);
//        when(authentication.getName()).thenReturn(username);
//        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
//        when(file.getContentType()).thenReturn("image/jpeg");
//        when(file.getOriginalFilename()).thenReturn("newAvatar.jpg");
//        when(file.getBytes()).thenReturn(new byte[]{1, 2, 3});
//        when(restTemplate.exchange(eq("http://203.145.46.242:8080/api/court/public/upload-avatar"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
//                .thenReturn(new ResponseEntity<>("newAvatarUrl", HttpStatus.OK));
//        when(userRepository.save(user)).thenReturn(user);
//
//        // Act
//        String result = userService.updateAvatar(file);
//
//        // Assert
//        assertEquals("Upload avatar success", result);
//        verify(userRepository).save(user);
//        verify(restTemplate).exchange(eq("http://203.145.46.242:8080/api/court/public/upload-avatar"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
//        assertEquals("newAvatarUrl", user.getAvatar());
//    }

    @Test
    void updateAvatar_invalidImage_throwsException() {
        // Arrange
        String username = "testuser";
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("text/plain");
        when(file.getOriginalFilename()).thenReturn("invalid.txt");

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> userService.updateAvatar(file));
        assertEquals("INVALID_FILE", exception.getErrorCode());
        assertEquals("File must be image", exception.getMessage());
        verifyNoInteractions(userRepository, restTemplate);
    }

    @Test
    void createUser_nullPassword_throwsIllegalArgumentException() {
        // Arrange
        UserCreationRequest request = new UserCreationRequest();
        request.setUsername("testuser");
        request.setPassword(null);
        request.setEmail("test@example.com");
        request.setPhoneNumber("0123456789");

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> userService.createUser(request));
        verifyNoInteractions(userRepository, restTemplate);
    }

    @Test
    void createUser_emptyPassword_throwsIllegalArgumentException() {
        // Arrange
        UserCreationRequest request = new UserCreationRequest();
        request.setUsername("testuser");
        request.setPassword("");
        request.setEmail("test@example.com");
        request.setPhoneNumber("0123456789");

        // Act & Assert
        assertThrows(NullPointerException.class, () -> userService.createUser(request));
        verifyNoInteractions(userRepository, restTemplate);
    }

    @Test
    void createUser_minimalUsernameLength_success() {
        // Arrange
        UserCreationRequest request = new UserCreationRequest();
        request.setUsername("test");
        request.setPassword("password123");
        request.setEmail("test@example.com");
        request.setPhoneNumber("0123456789");
        User user = new User();
        user.setUsername("test");
        UserResponse userResponse = new UserResponse();
        userResponse.setUsername("test");
        HashSet<Role> roles = new HashSet<>();
        when(userMapper.toUserEntity(request)).thenReturn(user);
        when(roleService.getRole(PredefinedRole.USER_ROLE)).thenReturn(roles);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toUserResponse(user)).thenReturn(userResponse);

        // Act
        UserResponse result = userService.createUser(request);

        // Assert
        assertNotNull(result);
        assertEquals("test", result.getUsername());
        verify(userRepository).save(user);
        verify(userMapper).toUserResponse(user);
        assertTrue(user.isActive());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void createUser_duplicateEmail_throwsException() {
        // Arrange
        UserCreationRequest request = new UserCreationRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        request.setEmail("test@example.com");
        request.setPhoneNumber("0123456789");
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        when(userMapper.toUserEntity(request)).thenReturn(user);
        when(roleService.getRole(PredefinedRole.USER_ROLE)).thenReturn(new HashSet<>());
        when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("Duplicate email"));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> userService.createUser(request));
        assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());
        verify(userRepository).save(user);
        verifyNoInteractions(restTemplate);
    }

}
