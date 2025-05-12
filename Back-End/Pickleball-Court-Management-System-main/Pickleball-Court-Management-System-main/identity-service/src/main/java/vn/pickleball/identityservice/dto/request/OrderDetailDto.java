package vn.pickleball.identityservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailDto {
    @NotBlank(message = "courtSlotId must be not null")
    private String courtSlotId;

    @NotNull(message = "Start time must be not null")
    private LocalTime startTime;

    @NotNull(message = "End time must be not null")
    private LocalTime endTime;
    private BigDecimal price;
}
