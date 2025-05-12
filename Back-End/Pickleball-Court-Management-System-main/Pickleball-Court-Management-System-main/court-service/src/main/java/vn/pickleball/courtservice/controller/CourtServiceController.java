package vn.pickleball.courtservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.courtservice.dto.request.CourtServiceRequest;
import vn.pickleball.courtservice.dto.response.CourtServiceResponse;
import vn.pickleball.courtservice.service.CourtService_Service;

import java.util.List;

@RestController
@RequestMapping("/court-service")
@RequiredArgsConstructor
public class CourtServiceController {

    private final CourtService_Service courtServiceService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('STAFF')")
    public ResponseEntity<CourtServiceResponse> create(@RequestBody @Valid CourtServiceRequest request) {
        return ResponseEntity.ok(courtServiceService.createCourtService(request));
    }

    @PutMapping("/update")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('STAFF')")
    public ResponseEntity<CourtServiceResponse> update(@RequestBody @Valid CourtServiceRequest request) {
        return ResponseEntity.ok(courtServiceService.updateCourtService(request));
    }

    @PutMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('STAFF')")
    public ResponseEntity<?> setActive(@RequestParam String id, @RequestParam boolean active) {
        courtServiceService.activateCourtService(id, active);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadBackground(@RequestParam String serviceId, @RequestParam("file") MultipartFile file) {
        courtServiceService.uploadImage(serviceId,file);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/manage/getServices")
    public ResponseEntity<List<CourtServiceResponse>> getByCourtId(@RequestParam String  courtId) {
        return ResponseEntity.ok(courtServiceService.getAllCourtServicesByCourtId(courtId));
    }
}

