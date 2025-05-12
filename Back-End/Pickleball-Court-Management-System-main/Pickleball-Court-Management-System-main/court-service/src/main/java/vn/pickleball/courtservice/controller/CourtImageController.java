package vn.pickleball.courtservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.courtservice.entity.CourtImage;
import vn.pickleball.courtservice.service.CourtImageService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/court-images")
@RequiredArgsConstructor
public class CourtImageController {

    private final CourtImageService courtImageService;

    @PostMapping("/upload")
    public ResponseEntity<CourtImage> uploadCourtImage(
            @RequestParam("courtId") String courtId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("isMap") boolean isMap) throws IOException {
        return ResponseEntity.ok(courtImageService.uploadCourtImage(file, courtId, isMap));
    }


    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteCourtImage(@RequestParam String imageId) {
        courtImageService.deleteCourtImage(imageId);
        return ResponseEntity.noContent().build();
    }
}
