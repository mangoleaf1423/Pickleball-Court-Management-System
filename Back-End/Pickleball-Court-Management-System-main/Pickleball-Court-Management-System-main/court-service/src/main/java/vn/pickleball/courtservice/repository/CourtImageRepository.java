package vn.pickleball.courtservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pickleball.courtservice.entity.CourtImage;

import java.util.List;

public interface CourtImageRepository extends JpaRepository<CourtImage, String> {
    List<CourtImage> findByCourtIdAndMapImage(String courtId, boolean isDiagram);
    List<CourtImage> findByCourtId(String courtId);
}
