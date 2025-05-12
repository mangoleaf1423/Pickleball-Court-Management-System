package vn.pickleball.identityservice.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.identityservice.client.CourtClient;
import vn.pickleball.identityservice.constant.PredefinedRole;
import vn.pickleball.identityservice.dto.payment.NotificationResponse;
import vn.pickleball.identityservice.dto.request.ChangePasswordRequest;
import vn.pickleball.identityservice.dto.request.CourtMap;
import vn.pickleball.identityservice.dto.request.UserCreationRequest;
import vn.pickleball.identityservice.dto.request.UserUpdateRequest;
import vn.pickleball.identityservice.dto.response.CourtManage;
import vn.pickleball.identityservice.dto.response.PagedUserResponse;
import vn.pickleball.identityservice.dto.response.UserResponse;
import vn.pickleball.identityservice.entity.CourtStaff;
import vn.pickleball.identityservice.entity.CourtStaffId;
import vn.pickleball.identityservice.entity.Role;
import vn.pickleball.identityservice.entity.User;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.exception.AppException;
import vn.pickleball.identityservice.exception.ErrorCode;
import vn.pickleball.identityservice.mapper.UserMapper;
import vn.pickleball.identityservice.repository.CourtStaffRepository;
import vn.pickleball.identityservice.repository.RoleRepository;
import vn.pickleball.identityservice.repository.UserRepository;
import vn.pickleball.identityservice.repository.UserSpecification;
import vn.pickleball.identityservice.utils.GenerateString;
import vn.pickleball.identityservice.utils.SecurityContextUtil;
import vn.pickleball.identityservice.websockethandler.NotificationWebSocketHandler;

import java.io.IOException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ScheduledExecutorService;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class UserService {
    UserRepository userRepository;
    RoleService roleService;
    UserMapper userMapper;
    EmailService emailService;
    CourtClient courtClient;
    CourtStaffService courtStaffService;
    NotificationWebSocketHandler socketHandler;
    RedisTemplate<String, UserCreationRequest> redisUserTemplate;
    private final RestTemplate restTemplate = new RestTemplate();


    public UserResponse createUser(UserCreationRequest request) {


        User user = userMapper.toUserEntity(request);

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        HashSet<Role> roles = roleService.getRole(PredefinedRole.USER_ROLE);

        user.setRoles(roles);
        user.setActive(true);

        // check exist ( username , email , phoneNumber unique)
        // DataIntegrityViolationException trùng khi save => throw exception user existed
        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        return userMapper.toUserResponse(user);
    }

    public String registerStudent(UserCreationRequest request) {
        if (!isValidEduEmail(request.getEmail())) {
            throw new ApiException("Email must be student email (.edu.vn)", "INVALID_EMAIL");
        }
        saveUserToRedis(request);
        emailService.sendRegistrationConfirmationEmail(request.getEmail(),request.getPhoneNumber(),request.getFirstName()+request.getLastName());
        return request.getPhoneNumber();
    }

    public void forgetPass(String key){
        User user = userRepository
                .findByUsernameOrEmailOrPhoneNumber(key)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String email = user.getEmail();

        if(email==null) throw new ApiException("Account not have email", "NO_EMAIL");
        String newPass = GenerateString.generateRandomPass(8);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        user.setPassword(passwordEncoder.encode(newPass));
        userRepository.save(user);
        emailService.sendNewPasswordEmail(email,newPass);
    }


    public UserResponse confirmRegisterStudent(String phoneNumber){
        UserCreationRequest request = getUserFromRedis(phoneNumber);
        if(request == null){
            throw new ApiException("Confirmation email is expired", "INVALID_CONFIRM");
        }

        User user = userMapper.toUserEntity(request);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        HashSet<Role> roles = roleService.getRole("STUDENT");

        user.setRoles(roles);
        user.setActive(true);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        return userMapper.toUserResponse(user);

    }


    public boolean isValidEduEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.edu\\.vn$");
    }

    public void saveUserToRedis(UserCreationRequest user) {
        redisUserTemplate.opsForValue().set("USER:" + user.getPhoneNumber(), user, Duration.ofHours(1));
    }

    public UserCreationRequest getUserFromRedis(String phoneNumber) {
        return redisUserTemplate.opsForValue().get("USER:" + phoneNumber);
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    public void changePassword(ChangePasswordRequest request) {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated) {
            throw new ApiException("Current pass incorrect","FAIL_PASS");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

//    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse updateUser(UserUpdateRequest request) {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        userMapper.updateUser(user, request);

//        var roles = roleRepository.findAllById(request.getRoles());
//        user.setRoles(new HashSet<>(roles));

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Transactional
    public UserResponse updateUserByAdmin(UserUpdateRequest request) {
        log.info("Updating user with ID: {}, courtIds: {}", request.getId(), request.getCourtIds());

        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            user.setRoles(roleService.getRole("USER"));
        } else {
            user.setRoles(new HashSet<>(roleService.getAllByIds(request.getRoles())));
        }

        user.setActive(request.isActive());

        if (request.getCourtIds() != null) {
            validateCourtId(request.getCourtIds());

            List<String> newCourtIds = request.getCourtIds();

            courtStaffService.deleteByUserIdAndCourtIdsNotIn(request.getId(), newCourtIds);

            Set<CourtStaff> newCourtStaffs = new HashSet<>();
            for (String courtId : newCourtIds) {
                CourtStaff courtStaff = CourtStaff.builder()
                        .id(new CourtStaffId(request.getId(), courtId))
                        .userId(request.getId())
                        .courtId(courtId)
                        .build();
                newCourtStaffs.add(courtStaff);
            }

            user.getCourtStaffs().clear();
            user.getCourtStaffs().addAll(newCourtStaffs);
        }

        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public UserResponse createUserByAdmin(UserCreationRequest request) {
        User user = userMapper.toUserEntity(request);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        var roles = roleService.getAllByIds(request.getRoles());
        user.setRoles(new HashSet<>(roles));
        user.setActive(true);
        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if(request.getCourtIds() != null){
            validateCourtId(request.getCourtIds());
            user.getCourtStaffs().clear();
            for (String courtId : request.getCourtIds()) {
                CourtStaff courtStaff = CourtStaff.builder()
                        .id(new CourtStaffId(user.getId(), courtId))
                        .userId(user.getId())
                        .courtId(courtId)
                        .build();
                user.getCourtStaffs().add(courtStaff);
            }
        }
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public PagedUserResponse getUsers(int page, int size, String username, String phoneNumber, String email, String roleName, String courtId) {
        Pageable pageable = PageRequest.of(page - 1 , size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> userPage = userRepository.findAll(
                UserSpecification.filterUsersExcludeAdmin(username, phoneNumber, email, roleName, courtId),
                pageable
        );

        List<UserResponse> userResponses = userMapper.toUsersResponses(userPage.getContent());

        return PagedUserResponse.builder()
                .users(userResponses)
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .build();
    }


    @PreAuthorize("hasRole('MANAGER')")
    public PagedUserResponse getUsersManager(int page, int size, String username, String phoneNumber, String email, String roleName, String courtId) {
        Pageable pageable = PageRequest.of(page - 1 , size, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<String> courts = courtId != null  ? courtId.lines().toList() : courtStaffService.getCourtsByUserId(SecurityContextUtil.getUid());
        Page<User> userPage = userRepository.findAll(
                UserSpecification.filterUsersExcludeManager(username, phoneNumber, email, roleName, courts),
                pageable
        );

        List<UserResponse> userResponses = userMapper.toUsersResponses(userPage.getContent());

        return PagedUserResponse.builder()
                .users(userResponses)
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .build();
    }


    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsersByRole(String role) {
        return userRepository.findUsersWithRole(role != null ? role.toUpperCase() : null).stream().map(userMapper::toUserResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public void updateUserStatus(String userId, boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found with id: " + userId, "USER_NOTFOUND"));
        user.setActive(isActive);
        userRepository.save(user);
    }

    public String updateAvatar(MultipartFile file){
        if(!isValidImage(file)) throw new ApiException("File must be image", "INVALID_FILE");
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String oldPath = user.getAvatar() ;

        String avatar = null;
        try {
            avatar = uploadAvatarCourt(file, oldPath);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        if(avatar == null || avatar.isEmpty()) return  "Upload avatar fail";

        user.setAvatar(avatar);

        userRepository.save(user);

        return "Upload avatar success";
    }

    private void validateCourtId(List<String> courtIds) {
        List<String> existedCourtIds = courtClient.getCourtIds().getBody();

        if (existedCourtIds == null) {
            throw new ApiException("Must have at least one court", "NULL_COURT");
        }

        // Tìm các ID không tồn tại
        List<String> invalidIds = courtIds.stream()
                .filter(id -> !existedCourtIds.contains(id))
                .toList();

        if (!invalidIds.isEmpty()) {
            throw new ApiException("Invalid court IDs: " + invalidIds, "INVALID_COURTIDS");
        }
    }

    public String uploadAvatarCourt(MultipartFile file, String oldPath) throws IOException {
        String url = "http://203.145.46.242:8080/api/court/public/upload-avatar";

        // Chuyển MultipartFile thành ByteArrayResource
        ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();  // Phải có để server nhận được tên file
            }
        };

        // Tạo body multipart
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileAsResource);
        body.add("oldPath", oldPath);

        // Header HTTP
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        // Đóng gói HTTP request
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        // Gửi request
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

        return response.getBody();
    }

    public User findByUsernameOrEmailOrPhoneNumber(String key){
        return userRepository
                .findByUsernameOrEmailOrPhoneNumber(key)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    public User findByUsername(String userName){
        return userRepository
                .findByUsername(userName)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    public Optional<User> findByPhoneNumber(String phoneNumber){
        return userRepository
                .findByPhoneNumber(phoneNumber);
    }

    public User findById(String id){
        return userRepository
                .findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    public List<String> getCourtsByUserId(String userId){
        return courtStaffService.getCourtsByUserId(userId);
    }

    public List<String> getUsersByCourtId(String courtId){
        return courtStaffService.getUsersByCourtId(courtId);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public List<CourtManage> getCourtManage() {
        List<String> courtIdsManage = courtStaffService.getCourtsByUserId(SecurityContextUtil.getUid());
        List<CourtMap> courts = courtClient.getAllCourts().getBody();

        boolean isAdmin = SecurityContextUtil.isAdmin();

        return courts.stream()
                .filter(court -> isAdmin || courtIdsManage.contains(court.getId()))
                .map(court -> new CourtManage(court.getId(), court.getName()))
                .collect(Collectors.toList());
    }

    public boolean isValidImage(MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        if (contentType == null || filename == null) {
            return false;
        }

        String lowerFilename = filename.toLowerCase();
        boolean validExtension = lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")
                || lowerFilename.endsWith(".png") || lowerFilename.endsWith(".gif") || lowerFilename.endsWith(".bmp");

        return contentType.startsWith("image/") && validExtension;
    }
}
