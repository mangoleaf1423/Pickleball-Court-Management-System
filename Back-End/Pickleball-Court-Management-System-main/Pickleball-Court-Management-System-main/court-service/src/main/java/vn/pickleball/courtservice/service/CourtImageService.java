package vn.pickleball.courtservice.service;


import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.courtservice.entity.Court;
import vn.pickleball.courtservice.entity.CourtImage;
import vn.pickleball.courtservice.exception.ApiException;
import vn.pickleball.courtservice.repository.CourtImageRepository;
import vn.pickleball.courtservice.repository.CourtRepository;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourtImageService {

    private final CourtImageRepository courtImageRepository;
    private final CourtService courtService;
    private final FirebaseStorageService firebaseStorageService;

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public CourtImage uploadCourtImage(MultipartFile file, String courtId, boolean isMap) throws IOException {
        if(!courtService.isValidImage(file)) throw new ApiException("File must be image", "INVALID_FILE");
        Court court = courtService.getCourtByCourtId(courtId);

        if (isMap) {
            List<CourtImage> existingMaps = courtImageRepository.findByCourtIdAndMapImage(courtId, true);
            for (CourtImage img : existingMaps) {
                firebaseStorageService.deleteFile(img.getImageUrl());
                courtImageRepository.delete(img);
            }
        }

        String path = "courts/" + courtId + (isMap ? "/map" : "/images/") + UUID.randomUUID();
        String imageUrl = firebaseStorageService.uploadFile(file, path);

        CourtImage courtImage = new CourtImage(null, court, imageUrl, isMap);
        return courtImageRepository.save(courtImage);
    }
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public void deleteCourtImage(String imageId) {
        CourtImage courtImage = courtImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));
        firebaseStorageService.deleteFile(courtImage.getImageUrl());
        courtImageRepository.delete(courtImage);
    }

    public List<CourtImage> getCourtImages(String courtId, boolean isMap) {
        return courtImageRepository.findByCourtIdAndMapImage(courtId, isMap);
    }
}

