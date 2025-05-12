package vn.pickleball.courtservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.pickleball.courtservice.entity.Court;
import vn.pickleball.courtservice.entity.CourtSlot;

import java.util.List;
import java.util.Optional;

public interface CourtSlotRepository extends JpaRepository<CourtSlot, String> {
    List<CourtSlot> findByCourtIdOrderByCreatedAtAsc(String courtId);

    @Query("SELECT cs FROM CourtSlot cs WHERE cs.court.id = :courtId")
    List<CourtSlot> findByCourtId(@Param("courtId") String courtId);

    @Query("SELECT cs FROM CourtSlot cs WHERE cs.court.id = :courtId AND cs.isActive = true")
    List<CourtSlot> findActiveByCourtId(@Param("courtId") String courtId);

    Optional<CourtSlot> findByCourtIdAndName(String courtId,String name);
}
