package vn.pickleball.courtservice.dto.response;

import lombok.Data;

@Data
public class CourtServiceResponse {
    private String id;
    private String courtId;
    private String category;
    private String name;
    private Double price;
    private Integer quantity;
    private String unit;
    private String description;
    private String imageUrl;
    private boolean isActive;
    private Integer soldCount;
}