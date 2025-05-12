package vn.pickleball.identityservice.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PagedUserResponse {
    List<UserResponse> users;
    int totalPages;
    long totalElements;
}
