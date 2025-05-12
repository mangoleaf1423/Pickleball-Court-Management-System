package vn.pickleball.identityservice.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtStaffId implements Serializable {

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "court_id", nullable = false, length = 36)
    private String courtId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CourtStaffId that = (CourtStaffId) o;
        return Objects.equals(userId, that.userId) &&
                Objects.equals(courtId, that.courtId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, courtId);
    }
}
