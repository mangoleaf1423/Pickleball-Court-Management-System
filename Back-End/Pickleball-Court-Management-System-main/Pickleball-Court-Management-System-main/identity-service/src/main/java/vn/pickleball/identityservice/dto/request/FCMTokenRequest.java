package vn.pickleball.identityservice.dto.request;

import lombok.Data;

@Data
public class FCMTokenRequest {
    private String key;
    private String token;
}

