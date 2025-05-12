package vn.pickleball.courtservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CourtRequest {
    private String id;

    @NotBlank(message = "Court name must be not null")
    private String name;

    @NotBlank(message = "Address must be not null")
    private String address;

    @NotBlank(message = "PhoneNumber must be not null")
    private String phone;
    private String openTime;
    private boolean isActive;
    @Email(message = "Invalid email format")
    private String email;
    private String link;
}
