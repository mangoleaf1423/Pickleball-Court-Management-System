package vn.pickleball.identityservice.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Current password must be not null")
    private String password;
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-={}\\[\\]:;\"'<>,.?/]{6,}$",
            message = "Password must be at least 6 characters and is alphanumeric"
    )
    private String newPassword;
}