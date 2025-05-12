package vn.pickleball.identityservice.controller;

import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.pickleball.identityservice.dto.payment.MbVietQrRefundWithAmountRequest;
import vn.pickleball.identityservice.dto.request.*;
import vn.pickleball.identityservice.dto.response.*;
import vn.pickleball.identityservice.service.*;
import vn.pickleball.identityservice.utils.GenerateString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {
    private final OrderService orderService;
    private final FCMService fcmService;
    private final NotificationService notificationService;
    private final UserService userService;
    private final EmailService emailService;

    @PostMapping("/create_order") //*
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderRequest orderRequest) {
        OrderResponse orderResponse = orderService.createOrder(orderRequest);
        return ResponseEntity.ok(orderResponse);
    }

    @PostMapping("/change_order") //*
    public ResponseEntity<OrderResponse> changeOrder(@RequestParam String orderId,@Valid @RequestBody OrderRequest orderRequest) {
        OrderResponse orderResponse = orderService.changeOrder(orderRequest, orderId);
        return ResponseEntity.ok(orderResponse);
    }

    @PostMapping("/paymentNotify")
    public ResponseEntity<String> receivePaymentNotification(@RequestBody vn.pickleball.identityservice.dto.payment.NotificationResponse response) {
        try {
            orderService.paymentNotification(response);
            return ResponseEntity.ok("Notification received successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to process notification");
        }
    }

    @PostMapping("/refund")
    public ResponseEntity<String> receivePaymentNotification(@RequestBody MbVietQrRefundWithAmountRequest refundWithAmountRequest) {
            orderService.refund(refundWithAmountRequest);
            return ResponseEntity.ok("REFUND_SUCCESS");
    }

    @GetMapping("/getOrders") //*
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam String value) {

        List<OrderResponse> orders = orderService.getOrders(value);
        return ResponseEntity.ok(orders);
    }
    @GetMapping("/getOrderById") //*
    public ResponseEntity<OrderResponse> getOrderById(
            @RequestParam String orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @PutMapping("/cancelOrder") //*
    public ResponseEntity<OrderResponse> cancelOrder(
            @RequestParam String orderId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId));
    }

    @PostMapping("/notification/save-token")
    public ResponseEntity<?> saveToken(@RequestBody FCMTokenRequest request) {
        fcmService.saveFcmToken(request.getKey(), request.getToken());
        return ResponseEntity.ok("FCM Token saved successfully");
    }

    @PutMapping("/notification/read")
    public ResponseEntity<NotificationRequest> updateStatus(
            @RequestParam String id) {
        return ResponseEntity.ok(notificationService.updateStatus(id));
    }


    @GetMapping("/notification/getNotifications") //*
    public ResponseEntity<NotificationResponse> getAllNotifications(@RequestParam String value) {
        return ResponseEntity.ok(notificationService.getAllNotifications(value));
    }

    @GetMapping("/notification/courtUnRead")
    public ResponseEntity<Long> courtUnRead(@RequestParam String value) {
        return ResponseEntity.ok(notificationService.courtUnRead(value));
    }

//    @PostMapping("/sendEmail")
//    public String sendEmal(@RequestBody OrderResponse response){
//        emailService.sendBookingConfirmationEmail("ruannvhe160301@fpt.edu.vn",response);
//        return "success";
//    }

    @PostMapping("/test_send-fcm")
    public void testFCM(@RequestParam String key){
        orderService.testFcm(key);
    }

    @GetMapping("/booked-slots")
    public ResponseEntity<UpdateBookingSlot> getBookedSlots(
            @RequestParam String courtId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bookingDate) {

        UpdateBookingSlot bookedSlots = orderService.getBookedSlot(courtId, bookingDate);

        return ResponseEntity.ok(bookedSlots);
    }
    @GetMapping("/getSignature")
    public String getSignature(@RequestParam String totalAmount,@RequestParam String paymentAmount,
                               @RequestParam String depositAmount,@RequestParam String bookingDate){
        return GenerateString.encode(totalAmount,paymentAmount,depositAmount, bookingDate);
    }

    @PostMapping("/check-invalid-slots")
    public ResponseEntity<Map<String, Object>> checkInvalidCourtSlots(
            @RequestBody CheckValidFixed request) {

        List<LocalDate> bookingDates = orderService.getBookingDatesFromDaysOfWeek(request.getStartDate(),
                request.getEndDate(), request.getDaysOfWeek());

        Map<String, Object> response = orderService.getInvalidCourtSlots(
                request.getCourtId(), bookingDates, request.getStartTime(), request.getEndTime());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payment-value")
    public BigDecimal getPaymentValue(
            @RequestParam String courtId,
            @RequestParam String daysOfWeek, // "MONDAY,TUESDAY"
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {

        List<LocalDate> bookingDates = orderService.getBookingDatesFromDaysOfWeek(startDate, endDate, daysOfWeek);

        return orderService.getPaymentAmount(courtId,bookingDates,startTime,endTime);
    }

    @PostMapping("/order-fixed") //*
    public ResponseEntity<OrderResponse> createFixedBooking(@RequestBody @Valid FixedBookingRequest request) {
        OrderResponse response = orderService.createFixedBooking(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/paymentOrder") //*
    public ResponseEntity<String> paymentOrder(@RequestParam String orderId) {
        return ResponseEntity.ok(orderService.createPaymentOrder(orderId));
    }

    @PostMapping("/noti/maintenance")
    public ResponseEntity<String> sendMaintenanceNotification(@RequestParam String courtId, @RequestParam String courtSlotId) {
        notificationService.sendNotiMaintenance(courtId, courtSlotId);
        return ResponseEntity.ok("Maintenance notification sent successfully");
    }

    @PostMapping("/order/service") //*
    public ResponseEntity<OrderResponse> orderService(@RequestBody @Valid OrderServiceRequest request){
        return ResponseEntity.ok(orderService.createServiceOrder(request));
    }

    @GetMapping("/getTransactionHistory") //*
    public List<TransactionHistory> getTransactionHistory(@RequestParam String orderId){
        return orderService.getTransactionHistory(orderId);
    }

    @GetMapping("/getCourtIdsByUserId")
    public List<String> getCourtIdsByUserId(@RequestParam String userid){
        return userService.getCourtsByUserId(userid);
    }

}
