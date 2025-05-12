package vn.pickleball.courtservice.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "court_maintenance_history")
public class CourtMaintenanceHistory {
    @Id
    @UuidGenerator
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "court_slot_id", nullable = false)
    private CourtSlot courtSlot;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column
    private LocalDateTime finishAt;

    @Column(length = 500)
    private String description;

    private String status;
}

