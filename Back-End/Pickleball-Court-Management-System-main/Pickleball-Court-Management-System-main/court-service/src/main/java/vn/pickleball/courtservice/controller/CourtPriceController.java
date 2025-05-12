package vn.pickleball.courtservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.pickleball.courtservice.dto.request.CourtPriceRequest;
import vn.pickleball.courtservice.dto.response.CourtPriceResponse;
import vn.pickleball.courtservice.service.CourtPriceService;

@RestController
@RequestMapping("/court-price")
@RequiredArgsConstructor
public class CourtPriceController {

    private final CourtPriceService courtPriceService;

    @PostMapping
    public ResponseEntity<CourtPriceResponse> createOrUpdateCourtPrice(@RequestBody CourtPriceRequest courtPriceRequest) {
        CourtPriceResponse courtPriceResponse = courtPriceService.createOrUpdateCourtPrice(courtPriceRequest);
        return ResponseEntity.ok(courtPriceResponse);
    }

    @GetMapping("/court/{courtId}")
    public ResponseEntity<CourtPriceResponse> getCourtPriceByCourtId(@PathVariable String courtId) {
        CourtPriceResponse courtPriceResponse = courtPriceService.getCourtPriceByCourtId(courtId);
        return ResponseEntity.ok(courtPriceResponse);
    }
}