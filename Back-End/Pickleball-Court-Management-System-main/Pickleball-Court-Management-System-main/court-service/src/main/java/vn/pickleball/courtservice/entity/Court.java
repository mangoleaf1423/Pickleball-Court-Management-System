package vn.pickleball.courtservice.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Data
@Entity
@Table(name = "court")
public class Court extends BaseEntity{

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String phone;

    private String openTime;

    private boolean isActive;

    private String email;

    private String link;

    private String logoUrl;

    private String backgroundUrl;

    @OneToMany(mappedBy = "court")
    @JsonManagedReference
    private List<CourtSlot> courtSlots;

    @OneToMany(mappedBy = "court")
    @JsonManagedReference
    private List<TimeSlot> timeSlots;

    @OneToMany(mappedBy = "court")
    @JsonManagedReference
    private List<CourtPrice> courtPrices;

    @OneToMany(mappedBy = "court")
    @JsonManagedReference
    private List<CourtImage> courtImages;

    @OneToMany(mappedBy = "court", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<CourtServiceEntity> courtServices;
}
