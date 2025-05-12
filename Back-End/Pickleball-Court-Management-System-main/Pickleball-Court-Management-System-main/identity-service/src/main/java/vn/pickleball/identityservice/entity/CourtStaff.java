package vn.pickleball.identityservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "court_staff")
public class CourtStaff {

    @EmbeddedId
    private CourtStaffId id;

    @Column(name = "user_id", nullable = false, insertable = false, updatable = false, length = 36)
    private String userId;

    @Column(name = "court_id", nullable = false, insertable = false, updatable = false, length = 36)
    private String courtId;
}
