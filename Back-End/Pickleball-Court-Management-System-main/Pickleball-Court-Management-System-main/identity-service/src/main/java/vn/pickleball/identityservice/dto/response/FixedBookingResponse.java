package vn.pickleball.identityservice.dto.response;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@Builder
public class FixedBookingResponse {
    private String id;
    private String courtId;

    private String courtName;

    private String address;

    private String userId;

    private String customerName;

    private String phoneNumber;

    private String note;

    //    @NotBlank(message = "Order type is required")
    private String orderType;

    private String orderStatus;

    private String paymentStatus;

//    private LocalDate startDate;
//
//    private LocalDate endDate;

    private LocalTime startTime;

    private LocalTime endTime;

//    private String selectedDays; // Ngày trong tuần khách chọn

    private BigDecimal paymentAmount;
    private LocalDateTime paymentTimeout;

    private List<FixedResponse> fixedOrderDetails;
    private List<FixedResponse> flexibleOrderDetails;
    private String qrcode;
    private LocalDateTime createdAt;
}
