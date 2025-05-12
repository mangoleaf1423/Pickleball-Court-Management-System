package vn.pickleball.identityservice.controller;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.identityservice.dto.request.ApiResponse;
import vn.pickleball.identityservice.dto.request.ChangePasswordRequest;
import vn.pickleball.identityservice.dto.request.UserCreationRequest;
import vn.pickleball.identityservice.dto.request.UserUpdateRequest;
import vn.pickleball.identityservice.dto.response.CourtManage;
import vn.pickleball.identityservice.dto.response.PagedUserResponse;
import vn.pickleball.identityservice.dto.response.UserResponse;
import vn.pickleball.identityservice.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {
    UserService userService;

    @PostMapping("/create_user")
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @PostMapping("/registerForStudent")
    String registerForStudent(@RequestBody @Valid UserCreationRequest request) {
        return userService.registerStudent(request);
    }



    @GetMapping
    public ResponseEntity<PagedUserResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String roleName,
            @RequestParam(required = false) String courtId
    ) {
        return ResponseEntity.ok(userService.getUsers(page, size, username, phoneNumber, email, roleName, courtId));
    }

    @GetMapping("/getUsersByManager")
    public ResponseEntity<PagedUserResponse> getUsersManager(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String roleName,
            @RequestParam(required = false) String courtId
    ) {
        return ResponseEntity.ok(userService.getUsersManager(page, size, username, phoneNumber, email, roleName,courtId));
    }

    @GetMapping("/getUsersWithRole")
    ApiResponse<List<UserResponse>> getUsersWithRole(@RequestParam String role) {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsersByRole(role))
                .build();
    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok("Password changed successfully");
    }
    @PostMapping("/upload-avatar")
    public ResponseEntity<?> changePassword(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.updateAvatar(file));
    }

    @DeleteMapping("/{userId}")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder().result("User has been deleted").build();
    }

    @PutMapping("/update")
    ApiResponse<UserResponse> updateUser( @RequestBody @Valid UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(request))
                .build();
    }

    @PutMapping("/admin_update")
    ApiResponse<UserResponse> updateUserByAdmin( @RequestBody @Valid UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUserByAdmin(request))
                .build();
    }

    @PostMapping("/admin_create")
    ApiResponse<UserResponse> createUserByAdmin(@RequestBody @Valid UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUserByAdmin(request))
                .build();
    }

    @PutMapping("/activate")
    public ResponseEntity<String> updateUserStatus(@RequestParam String userId, @RequestParam boolean isActive) {
        userService.updateUserStatus(userId, isActive);
        return ResponseEntity.ok(isActive ? "User activated successfully" : "User disabled successfully");
    }

    @GetMapping("/getCourtManage")
    public List<CourtManage> getCourtMange(){
        return userService.getCourtManage();
    }

}
