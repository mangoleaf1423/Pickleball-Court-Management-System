package vn.pickleball.identityservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.identityservice.dto.request.*;
import vn.pickleball.identityservice.dto.response.CourtPriceResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@FeignClient(name = "court-client", url = "${court_service.url_service}")
public interface CourtClient {

    @PostMapping("${court_service.update_bookingSlot}")
    ResponseEntity<Void> updateBookingSlot(@RequestBody UpdateBookingSlot updateBookingSlot);

    @PostMapping("/public/check-maintenance-slots")
    ResponseEntity<Map<String, List<LocalDate>>> getInvalidCourtSlots(@RequestBody CheckValidMaintenance request);


    @GetMapping("/public/court_slot/getIdsByCourtId/{courtId}")
    ResponseEntity<List<String>> getCourtSlotIdsByCourtId(@PathVariable("courtId") String courtId);

    @GetMapping("/public/court_slot/id-by-name")
    String getCourtSlotIdByName(
            @RequestParam String courtId,
            @RequestParam String name);

    @PostMapping("/public/calculate-total-payment")
    BigDecimal calculateTotalPayment(@RequestBody BookingPaymentRequest request);

    @PostMapping("/public/upload-avatar")
    String uploadAvatar(@RequestParam("file") MultipartFile file, @RequestParam String oldPath);

    @PostMapping("/public/synchronous")
    void synchronous(@RequestParam String courtId);

    @GetMapping("/public/court_price/getByCourtId/{courtId}")
    CourtPriceResponse getCourtPriceByCourtId(@PathVariable("courtId") String courtId);

    @PostMapping("/public/service/purchase")
    ResponseEntity<Void> updateAfterPurchase(@RequestBody List<CourtServicePurchaseRequest> requests);

    @GetMapping("/public/court/ids")
    ResponseEntity<List<String>> getCourtIds();

    @GetMapping("/public/getCourtSlot/map")
    ResponseEntity<List<CourtSlotMap>> getCourtSlotMap(@RequestParam String courtId);

    @GetMapping("/public/getServices/map")
    ResponseEntity<List<CourtServiceMap>> getServiceMap(@RequestParam String courtId);

    @GetMapping("/public/getCourtMap")
    ResponseEntity<List<CourtMap>> getAllCourts();
}

