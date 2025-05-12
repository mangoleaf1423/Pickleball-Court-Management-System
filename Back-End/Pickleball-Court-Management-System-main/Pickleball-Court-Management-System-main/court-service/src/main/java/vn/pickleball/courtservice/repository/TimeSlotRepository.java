package vn.pickleball.courtservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pickleball.courtservice.entity.TimeSlot;

import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, String> {
    List<TimeSlot> findByCourtIdOrderByStartTimeAsc(String courtId);

    List<TimeSlot> findByCourtId(String courtId);
}
