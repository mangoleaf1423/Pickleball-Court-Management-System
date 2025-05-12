package vn.pickleball.identityservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Data
public class FixedBookingRequest {
    @NotBlank(message = "Court ID is required")
    private String courtId;

    private String userId;

    private String customerName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone number must be 10 or 11 digits")
    private String phoneNumber;

    private String note;

    //    @NotBlank(message = "Order type is required")
    private String orderType;

    @NotBlank(message = "Payment status is required")
    @Pattern(regexp = "^(Chưa thanh toán)$", message = "Payment status must be one of: Chưa thanh toán")
    private String paymentStatus;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @NotEmpty
    private String selectedDays; // Ngày trong tuần khách chọn

    @NotEmpty
    private List<String> selectedCourtSlots; // Danh sách slot khách chọn

    private Map<String, String> flexibleCourtSlotFixes; // Fix conflict (courtSlotName - ngày chọn)
}

