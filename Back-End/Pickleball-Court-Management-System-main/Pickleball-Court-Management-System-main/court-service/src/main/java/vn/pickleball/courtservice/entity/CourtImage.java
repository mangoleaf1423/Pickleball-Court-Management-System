package vn.pickleball.courtservice.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Data
@Entity
@Table(name = "court_image")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtImage {
    @Id
    @UuidGenerator
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private boolean mapImage;
}

