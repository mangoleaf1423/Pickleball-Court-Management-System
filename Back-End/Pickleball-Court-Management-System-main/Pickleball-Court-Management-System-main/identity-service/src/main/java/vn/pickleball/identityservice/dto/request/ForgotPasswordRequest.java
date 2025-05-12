package vn.pickleball.identityservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Must be is username , password or email")
    private String key;
}
