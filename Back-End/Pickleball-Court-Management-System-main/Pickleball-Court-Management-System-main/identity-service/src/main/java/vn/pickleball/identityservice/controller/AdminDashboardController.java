package vn.pickleball.identityservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.pickleball.identityservice.dto.request.OccupancyAnalysisRequest;
import vn.pickleball.identityservice.dto.request.PeakHoursAnalysisRequest;
import vn.pickleball.identityservice.dto.request.RevenueSummaryRequest;
import vn.pickleball.identityservice.dto.response.*;
import vn.pickleball.identityservice.entity.Order;
import vn.pickleball.identityservice.service.DashboardService;
import vn.pickleball.identityservice.service.OrderService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final DashboardService dashboardService;
    private final OrderService orderService;

    @GetMapping("/dashboard/transactions")
    public TransactionResponse getTransactions(
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String courtId,
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return dashboardService.getTransactionsWithSummary(paymentStatus, courtId, orderId, startDate, endDate, page, size);
    }

    @GetMapping("/dashboard/orders")
    public OrderPage getOrders(
            @RequestParam(required = false) String courtId,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false) String orderStatus,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return dashboardService.searchOrders(courtId, orderType, orderStatus, paymentStatus, startDate, endDate, page, size);
    }

    @GetMapping("/dashboard/getTransactionByOid")
    public List<TransactionDto> getTransactionsByOid(@RequestParam String orderId){
        return dashboardService.getTransactionByOrderId(orderId);
    }

    @PostMapping("/refund")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<String> refundByAdmin(@RequestParam String orderId,
                                                @RequestParam(required = false) BigDecimal refundAmount) {
        orderService.refundByAdmin(orderId, refundAmount);
        return ResponseEntity.ok("Refund processed successfully");
    }

    @PostMapping("/revenue/summary")
    public ResponseEntity<RevenueSummaryResponse> getRevenueSummary(
            @RequestBody RevenueSummaryRequest request) {
        return ResponseEntity.ok(dashboardService.generateRevenueReport(request));
    }

    @PostMapping("/occupancy-analysis")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<OccupancyAnalysisResponse> analyzeOccupancy(
            @Valid @RequestBody OccupancyAnalysisRequest request
    ) {
        return ResponseEntity.ok(dashboardService.analyzeOccupancy(request));
    }

    @PostMapping("/peak-hours-analysis")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<PeakHoursAnalysisResponse> analyzePeakHours(
            @Valid @RequestBody PeakHoursAnalysisRequest request
    ) {
        return ResponseEntity.ok(dashboardService.analyzePeakHours(request));
    }

    @GetMapping("/orders/export")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Resource> exportOrderReport(
            @RequestParam(required = false) String courtId,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false) String orderStatus,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        byte[] excelData = dashboardService.generateOrderReportExcel(courtId, orderType, orderStatus, paymentStatus, startDate, endDate);

        ByteArrayResource resource = new ByteArrayResource(excelData);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=order_report.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(excelData.length)
                .body(resource);
    }

    @GetMapping("/transactions/export")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Resource> exportTransactionReport(
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String courtId,
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {

        byte[] excelData = dashboardService.generateTransactionReportExcel(paymentStatus, courtId, orderId,startDate, endDate);

        ByteArrayResource resource = new ByteArrayResource(excelData);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=transaction_report.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(excelData.length)
                .body(resource);
    }

    @PostMapping("/revenue/export")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Resource> exportRevenueReport(@RequestBody RevenueSummaryRequest request) {

        byte[] excelData = dashboardService.generateRevenueReportExcel(request);

        ByteArrayResource resource = new ByteArrayResource(excelData);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=revenue_report.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(excelData.length)
                .body(resource);
    }
}
