package vn.pickleball.courtservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.pickleball.courtservice.entity.Court;

import java.util.List;

public interface CourtRepository extends JpaRepository<Court, String> {

    @Query("SELECT c.id FROM Court c")
    List<String> findAllCourtIds();

    @Query("SELECT c FROM Court c WHERE c.isActive = true")
    List<Court> findAllActiveCourts();
}
