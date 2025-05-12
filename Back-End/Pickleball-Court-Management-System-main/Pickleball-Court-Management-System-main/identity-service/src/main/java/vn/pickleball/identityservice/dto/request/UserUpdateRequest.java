package vn.pickleball.identityservice.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.pickleball.identityservice.dto.Gender;
import vn.pickleball.identityservice.dto.UserRank;
import vn.pickleball.identityservice.validator.DobConstraint;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String id;
    @Size(min = 4, message = "Username must be at least 4 characters")
    String username;


    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-={}\\[\\]:;\"'<>,.?/]{6,}$",
            message = "Password must be at least 6 characters and is alphanumeric"
    )
    String password;

    String firstName;
    String lastName;

    @DobConstraint(min = 10, message = "Minimum 10 years old")
    LocalDate dob;


    List<String> roles;

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^(0[0-9]{9,10})$", message = "Phone number must start with 0 and be 10-11 digits")
    private String phoneNumber;

    Gender gender;

    List<String> courtIds;

    private boolean isActive;
}
