package vn.pickleball.courtservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.pickleball.courtservice.entity.CourtServiceEntity;

import java.util.List;

public interface CourtServiceRepository extends JpaRepository<CourtServiceEntity, String> {
    List<CourtServiceEntity> findByCourtId(String courtId);

    @Query("SELECT cs FROM CourtServiceEntity cs WHERE cs.court.id = :courtId AND cs.isActive = true")
    List<CourtServiceEntity> findActiveByCourtId(@Param("courtId") String courtId);
}
