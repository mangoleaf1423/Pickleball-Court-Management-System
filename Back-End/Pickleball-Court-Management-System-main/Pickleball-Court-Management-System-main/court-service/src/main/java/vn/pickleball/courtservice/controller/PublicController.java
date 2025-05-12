package vn.pickleball.courtservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.courtservice.entity.CourtImage;
import vn.pickleball.courtservice.dto.request.*;
import vn.pickleball.courtservice.dto.response.*;
import vn.pickleball.courtservice.service.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {
    private final CourtSlotService courtSlotService;
    private final CourtPriceService courtPriceService;
    private final BookingSlotService bookingSlotService;
    private final CourtImageService courtImageService;
    private final CourtService_Service courtServiceService;
    private final CourtService courtService;
    private final CourtMaintenanceHistoryService maintenanceHistoryService;
    private final FirebaseStorageService firebaseStorageService;

    @GetMapping("/court_slot/{id}")
    public ResponseEntity<CourtSlotResponse> getCourtSlotById(@PathVariable String id) {
        CourtSlotResponse courtSlotResponse = courtSlotService.getCourtSlotById(id);
        return ResponseEntity.ok(courtSlotResponse);
    }

    @GetMapping("/court_slot")
    public ResponseEntity<List<CourtSlotResponse>> getAllCourtSlots() {
        List<CourtSlotResponse> courtSlotResponses = courtSlotService.getAllCourtSlots();
        return ResponseEntity.ok(courtSlotResponses);
    }

    @GetMapping("/court_slot/getByCourtId/{courtId}")
    public ResponseEntity<List<CourtSlotResponse>> getCourtSlotsByCourtId(@PathVariable String courtId) {
        List<CourtSlotResponse> courtSlotResponses = courtSlotService.getCourtSlotsByCourtId(courtId);
        return ResponseEntity.ok(courtSlotResponses);
    }

    @GetMapping("/getCourtSlot/map")
    public ResponseEntity<List<CourtSlotMap>> getCourtSlotMap(@RequestParam String courtId) {
        List<CourtSlotMap> simpleList = courtSlotService.getAllCourtSlotsByCourtId(courtId)
                .stream()
                .map(slot -> CourtSlotMap.builder().courtSlotId(slot.getId()).courtSlotName(slot.getName()).build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(simpleList);
    }

    @GetMapping("/court_slot/getIdsByCourtId/{courtId}")
    public ResponseEntity<List<String>> getCourtSlotIdsByCourtId(@PathVariable String courtId) {
        List<String> courtSlotIds = courtSlotService.getCourtSlotsByCourtId(courtId)
                .stream()
                .map(CourtSlotResponse::getName)
                .toList();
        return ResponseEntity.ok(courtSlotIds);
    }

    @GetMapping("/court_price/getByCourtId/{courtId}") //*
    public ResponseEntity<CourtPriceResponse> getCourtPriceByCourtId(@PathVariable String courtId) {
        CourtPriceResponse courtPriceResponse = courtPriceService.getCourtPriceByCourtId(courtId);
        return ResponseEntity.ok(courtPriceResponse);
    }

    @GetMapping("/booking_slot") //*
    public ResponseEntity<List<CourtSlotBookingResponse>> getBookingSlots(
            @RequestParam String courtId,
            @RequestParam LocalDate dateBooking
    ) {
        List<CourtSlotBookingResponse> bookingSlots = bookingSlotService.getBookingSlots(courtId, dateBooking);
        return ResponseEntity.ok(bookingSlots);
    }

    @PostMapping("/booking_slot/update")
    public ResponseEntity<Void> updateBookingSlots(
            @RequestBody UpdateBookingSlot updateBookingSlot
            ) {
        bookingSlotService.updateBookingSlotsInRedis(updateBookingSlot.getCourtId(),updateBookingSlot.getDateBooking(), updateBookingSlot.getStatus(),updateBookingSlot.getCourtSlotBookings());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/court-images/list") //*
    public ResponseEntity<List<CourtImage>> getCourtImages(
            @RequestParam("courtId") String courtId,
            @RequestParam("isMap") boolean isMap) {
        return ResponseEntity.ok(courtImageService.getCourtImages(courtId, isMap));
    }

    @GetMapping("/getServices") //*
    public ResponseEntity<List<CourtServiceResponse>> getByCourtId(@RequestParam String  courtId) {
        return ResponseEntity.ok(courtServiceService.getCourtServicesByCourtId(courtId));
    }

    @GetMapping("/getServices/map")
    public ResponseEntity<List<CourtServiceMap>> getServiceMap(@RequestParam String courtId) {
        List<CourtServiceMap> simpleList = courtServiceService
                .getAllCourtServicesByCourtId(courtId)
                .stream()
                .map(service -> CourtServiceMap.builder().id(service.getId()).name(service.getName()).build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(simpleList);
    }

    @PostMapping("/service/purchase")
    public ResponseEntity<Void> purchaseUpdate(@RequestBody @Valid List<CourtServicePurchaseRequest> requests) {
        courtServiceService.updateAfterPurchase(requests);
        return ResponseEntity.ok().build();
    }


    @PostMapping("/check-maintenance-slots")
    public ResponseEntity<Map<String, List<LocalDate>>> getInvalidCourtSlots(@RequestBody CheckValidMaintenance request) {

        Map<String, List<LocalDate>> invalidCourtSlots = maintenanceHistoryService.getMaintenanceCourtSlots(
                request.getCourtId(), request.getBookingDates(), request.getStartTime(), request.getEndTime());
        return ResponseEntity.ok(invalidCourtSlots);
    }

    @GetMapping("/court_slot/id-by-name")
    public String getCourtSlotIdByName(
            @RequestParam String courtId,
            @RequestParam String name) {
        CourtSlotResponse response = courtSlotService.getByName(courtId, name);
        return response.getId();
    }

    @PostMapping("/calculate-total-payment")
    public BigDecimal calculateTotalPayment(@RequestBody BookingPaymentRequest request) {
        return courtPriceService.calculateTotalPayment(request);
    }

    @PostMapping("/upload-avatar")
    public String uploadAvatar(@RequestPart("file") MultipartFile file,
                               @RequestPart(value = "oldPath", required = false) String oldPath) throws IOException {

        if (oldPath != null) {
            firebaseStorageService.deleteFile(oldPath);
        }

        return firebaseStorageService.uploadFile(file, "avatars");
    }
    @PostMapping("/synchronous")
    public void synchronous(@RequestParam String courtId){
        bookingSlotService.deleteBookingSlotsByCourtId(courtId);
    }

    @GetMapping("/court/ids")
    public ResponseEntity<List<String>> getCourtIds() {
        List<String> courtIds = courtService.getAllCourtIds();
        return ResponseEntity.ok(courtIds);
    }

    @GetMapping("/getCourtMap")
    public ResponseEntity<List<CourtMap>> getAllCourts() {
        List<CourtMap> simpleList = courtService.getAllCourts()
                .stream()
                .map(courts -> CourtMap.builder().id(courts.getId()).name(courts.getName()).address(courts.getAddress()).build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(simpleList);
    }
}
