package vn.pickleball.identityservice.controller;


import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.pickleball.identityservice.dto.request.*;
import vn.pickleball.identityservice.dto.response.AuthenticationResponse;
import vn.pickleball.identityservice.dto.response.IntrospectResponse;
import vn.pickleball.identityservice.dto.response.UserResponse;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.service.AuthenticationService;
import vn.pickleball.identityservice.service.UserService;

import java.io.IOException;
import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;

    UserService userService;

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody @Valid AuthenticationRequest request) {
        var result = authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .message("Login successfully")
                .result(result).build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .message("Valid token")
                .result(result).build();
    }

    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody @Valid RefreshRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.refreshToken(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .message("Refresh token successfully")
                .result(result).build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestBody @Valid LogoutRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);


        return ApiResponse.<Void>builder()
                .message("Logout success")
                .build();


    }

    @GetMapping("/confirm_student")
    ApiResponse<UserResponse> confirmStudent(@RequestParam String key , HttpServletResponse response) {
        try {
            response.sendRedirect("https://www.picklecourt.id.vn/"); // Redirect sau khi xác nhận
        } catch (IOException e) {
            throw new ApiException("Redirect failed", "SERVER_ERROR");
        }
        return ApiResponse.<UserResponse>builder()
                .result(userService.confirmRegisterStudent(key))
                .build();
    }

    @PostMapping("/forgetPassword")
    public void forgetPass(@RequestBody @Valid ForgotPasswordRequest request){
        userService.forgetPass(request.getKey());
    }

}
