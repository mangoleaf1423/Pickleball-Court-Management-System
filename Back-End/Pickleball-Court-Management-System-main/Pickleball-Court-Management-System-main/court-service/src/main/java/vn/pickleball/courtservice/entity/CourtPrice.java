package vn.pickleball.courtservice.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
import vn.pickleball.courtservice.dto.WeekType;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "court_price",
        uniqueConstraints = @UniqueConstraint(columnNames = {"court_id", "time_slot_id", "week_type"}))
public class CourtPrice {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id", nullable = false)
    @JsonBackReference
    private TimeSlot timeSlot;

    @Enumerated(EnumType.STRING)
    @Column(name = "week_type",nullable = false)
    private WeekType weekType; // WEEKDAY hoặc WEEKEND

    @Column(nullable = false)
    private BigDecimal regularPrice; // Giá khách cố định

    @Column(nullable = false)
    private BigDecimal dailyPrice;   // Giá khách theo ngày

    @Column(nullable = false)
    private BigDecimal studentPrice; // Giá học sinh/sinh viê
}
