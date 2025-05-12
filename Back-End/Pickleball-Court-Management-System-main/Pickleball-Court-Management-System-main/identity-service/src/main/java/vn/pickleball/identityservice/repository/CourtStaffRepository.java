package vn.pickleball.identityservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.pickleball.identityservice.entity.CourtStaff;
import vn.pickleball.identityservice.entity.CourtStaffId;

import java.util.List;

@Repository
public interface CourtStaffRepository extends JpaRepository<CourtStaff, CourtStaffId> {

    List<CourtStaff> findByUserId(String userId);

    List<CourtStaff> findByCourtId(String courtId);

    boolean existsByUserIdAndCourtId(String userId, String courtId);

    void deleteByUserId(String userId);

    @Modifying
    @Query("DELETE FROM CourtStaff cs WHERE cs.userId = :userId AND cs.courtId NOT IN :courtIds")
    void deleteByUserIdAndCourtIdsNotIn(String userId, List<String> courtIds);
}