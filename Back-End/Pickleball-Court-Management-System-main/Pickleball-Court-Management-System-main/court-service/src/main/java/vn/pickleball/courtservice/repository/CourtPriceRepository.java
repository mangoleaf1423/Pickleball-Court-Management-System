package vn.pickleball.courtservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.pickleball.courtservice.entity.CourtPrice;
import vn.pickleball.courtservice.entity.TimeSlot;
import vn.pickleball.courtservice.dto.WeekType;

import java.util.List;

public interface CourtPriceRepository extends JpaRepository<CourtPrice, String> {

    List<CourtPrice> findByCourtId(String courtId);

    @Query("SELECT cp.timeSlot FROM CourtPrice cp WHERE cp.court.id = :courtId AND cp.weekType = :weekType")
    List<TimeSlot> findTimeSlotsByCourtIdAndWeekType(@Param("courtId") String courtId, @Param("weekType") WeekType weekType);
}
