package vn.pickleball.courtservice.dto.response;

import lombok.Data;
import vn.pickleball.courtservice.entity.CourtImage;
import vn.pickleball.courtservice.entity.CourtPrice;
import vn.pickleball.courtservice.entity.CourtSlot;
import vn.pickleball.courtservice.entity.TimeSlot;

import java.util.List;

@Data
public class CourtDetail {

    private String id;

    private String name;

    private String address;

    private String phone;

    private String openTime;

    private boolean isActive;

    private String email;

    private String link;

    private String managerId;

    private String logoUrl;

    private String backgroundUrl;

    private List<CourtSlot> courtSlots;

    private List<TimeSlot> timeSlots;

    private List<CourtPrice> courtPrices;

    private List<CourtImage> courtImages;
}
