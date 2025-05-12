package vn.pickleball.courtservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.pickleball.courtservice.dto.request.CourtMaintenanceHistoryRequestDTO;
import vn.pickleball.courtservice.dto.request.CourtSlotRequest;
import vn.pickleball.courtservice.dto.response.CourtMaintenanceHistoryResponseDTO;
import vn.pickleball.courtservice.dto.response.CourtSlotResponse;
import vn.pickleball.courtservice.service.CourtMaintenanceHistoryService;
import vn.pickleball.courtservice.service.CourtSlotService;

import java.util.List;

@RestController
@RequestMapping("/court_slot")
@RequiredArgsConstructor
public class CourtSlotController {
    private final CourtSlotService courtSlotService;
    private final CourtMaintenanceHistoryService maintenanceHistoryService;


    @PostMapping
    public ResponseEntity<CourtSlotResponse> createCourtSlot(@RequestBody @Valid CourtSlotRequest courtSlotRequest) {
        CourtSlotResponse courtSlotResponse = courtSlotService.createCourtSlot(courtSlotRequest);
        return ResponseEntity.ok(courtSlotResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourtSlotResponse> getCourtSlotById(@PathVariable String id) {
        CourtSlotResponse courtSlotResponse = courtSlotService.getCourtSlotById(id);
        return ResponseEntity.ok(courtSlotResponse);
    }

    @GetMapping
    public ResponseEntity<List<CourtSlotResponse>> getAllCourtSlots() {
        List<CourtSlotResponse> courtSlotResponses = courtSlotService.getAllCourtSlots();
        return ResponseEntity.ok(courtSlotResponses);
    }

    @PutMapping()
    public ResponseEntity<CourtSlotResponse> updateCourtSlot(@RequestBody @Valid CourtSlotRequest courtSlotRequest) {
        CourtSlotResponse courtSlotResponse = courtSlotService.updateCourtSlot( courtSlotRequest);
        return ResponseEntity.ok(courtSlotResponse);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourtSlot(@PathVariable String id) {
        courtSlotService.deleteCourtSlot(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/disable/{id}")
    public ResponseEntity<Void> disableCourtSlot(@PathVariable String id) {
        courtSlotService.disableCourtSlot(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/active/{id}")
    public ResponseEntity<Void> activeCourtSlot(@PathVariable String id) {
        courtSlotService.activeCourtSlot(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/court/{courtId}")
    public ResponseEntity<List<CourtSlotResponse>> getCourtSlotsActiveByCourtId(@PathVariable String courtId) {
        List<CourtSlotResponse> courtSlotResponses = courtSlotService.getCourtSlotsByCourtId(courtId);
        return ResponseEntity.ok(courtSlotResponses);
    }
    @GetMapping("/manage/court/{courtId}")
    @PreAuthorize("@authorizationService.hasAccessToCourt(#courtId)")
    public ResponseEntity<List<CourtSlotResponse>> getCourtSlotsByCourtId(@PathVariable String courtId) {
        List<CourtSlotResponse> courtSlotResponses = courtSlotService.getAllCourtSlotsByCourtId(courtId);
        return ResponseEntity.ok(courtSlotResponses);
    }

    @PostMapping("/create-maintenance")
    public ResponseEntity<String> addMaintenanceHistory(@RequestBody @Valid CourtMaintenanceHistoryRequestDTO dto) {
        maintenanceHistoryService.addMaintenanceHistory(dto);
        return ResponseEntity.ok("Create maintenance successfully");
    }

    @GetMapping("/maintenance-history")
    public List<CourtMaintenanceHistoryResponseDTO> getHistories(@RequestParam String courtSlotId) {
        return maintenanceHistoryService.getHistoriesByCourtSlotId(courtSlotId);
    }

    @PutMapping("/update-maintenance")
    public ResponseEntity<String> updateMaintenanceHistory(@RequestBody @Valid CourtMaintenanceHistoryRequestDTO dto) {
        maintenanceHistoryService.updateMaintenanceHistory(dto);
        return ResponseEntity.ok("Update maintenance successfully");
    }
}
