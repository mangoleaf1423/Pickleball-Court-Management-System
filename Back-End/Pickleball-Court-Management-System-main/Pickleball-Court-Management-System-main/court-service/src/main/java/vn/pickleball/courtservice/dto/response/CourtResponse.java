package vn.pickleball.courtservice.dto.response;

import lombok.Data;

@Data
public class CourtResponse {
    private String id;
    private String name;
    private String address;
    private String phone;
    private String openTime;
    private boolean isActive;
    private String email;
    private String link;
    private String logoUrl;

    private String backgroundUrl;
}

