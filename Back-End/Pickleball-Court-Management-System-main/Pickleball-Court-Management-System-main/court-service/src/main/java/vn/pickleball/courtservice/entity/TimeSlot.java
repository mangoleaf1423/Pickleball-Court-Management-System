package vn.pickleball.courtservice.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
@Entity
@Table(name = "time_slot")
public class TimeSlot extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @OneToOne(mappedBy = "timeSlot", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private CourtPrice courtPrice;
}
