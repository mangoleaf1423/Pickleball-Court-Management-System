package vn.pickleball.courtservice.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Data
@Entity
@Table(name = "court_slot")
public class CourtSlot extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean isActive = true;

    @OneToMany(mappedBy = "courtSlot", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<CourtMaintenanceHistory> maintenanceHistories;
}
