package vn.pickleball.courtservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.pickleball.courtservice.entity.CourtMaintenanceHistory;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public interface CourtMaintenanceHistoryRepository extends JpaRepository<CourtMaintenanceHistory, String> {
    List<CourtMaintenanceHistory> findByCourtSlotIdOrderByStartTimeDesc(String courtSlotId);

    @Query("SELECT DISTINCT cmh.courtSlot.name, CAST(cmh.startTime AS date) " +
            "FROM CourtMaintenanceHistory cmh " +
            "JOIN cmh.courtSlot cs " +
            "WHERE cs.court.id = :courtId " +
            "AND cmh.status <> 'Hoàn thành' " +
            "AND CAST(cmh.startTime AS date) IN :bookingDates " +
            "AND (FUNCTION('TIME', cmh.startTime) <= :endTime " +
            "AND FUNCTION('TIME', cmh.endTime) >= :startTime)")
    List<Object[]> findMaintenanceCourtSlots(@Param("courtId") String courtId,
                                             @Param("bookingDates") List<LocalDate> bookingDates,
                                             @Param("startTime") LocalTime startTime,
                                             @Param("endTime") LocalTime endTime);




    @Query("SELECT c FROM CourtMaintenanceHistory c WHERE c.status <> :status " +
            "AND DATE(c.startTime) <= :today " +
            "AND DATE(c.endTime) >= :today")
    List<CourtMaintenanceHistory> findAllPendingMaintenances(
            @Param("status") String status,
            @Param("today") LocalDate today);





}
