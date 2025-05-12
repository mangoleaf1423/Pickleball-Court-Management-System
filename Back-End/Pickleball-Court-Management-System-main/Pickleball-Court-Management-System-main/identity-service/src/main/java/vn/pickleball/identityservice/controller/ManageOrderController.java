package vn.pickleball.identityservice.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.pickleball.identityservice.dto.response.OrderPage;
import vn.pickleball.identityservice.dto.response.OrderResponse;
import vn.pickleball.identityservice.service.OrderService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/manage")
@RequiredArgsConstructor
public class ManageOrderController {
    private final OrderService orderService;

    @GetMapping("/getByStaff")
    public ResponseEntity<OrderPage> getOrdersByFilter(
            @RequestParam(required = false) LocalDate bookingDate,
            @RequestParam(required = false) LocalTime startTime,
            @RequestParam(required = false) LocalTime endTime,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        OrderPage orders = orderService.getOrdersByFilterByStaff(
                bookingDate,
                startTime,
                endTime,
                phoneNumber,
                customerName,
                statuses,
                page,
                size
        );
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/order/checkin")
    public ResponseEntity<OrderResponse> checkin(
            @RequestParam String orderId) {


        return ResponseEntity.ok(orderService.checkin(orderId));
    }


}
