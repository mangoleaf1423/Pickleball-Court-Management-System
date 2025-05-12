package vn.pickleball.courtservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import vn.pickleball.courtservice.entity.CourtMaintenanceHistory;
import vn.pickleball.courtservice.entity.CourtSlot;
import vn.pickleball.courtservice.exception.ApiException;
import vn.pickleball.courtservice.dto.request.CourtMaintenanceHistoryRequestDTO;
import vn.pickleball.courtservice.dto.request.UpdateBookingSlot;
import vn.pickleball.courtservice.dto.response.CourtMaintenanceHistoryResponseDTO;
import vn.pickleball.courtservice.repository.CourtMaintenanceHistoryRepository;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourtMaintenanceHistoryService {

    private final CourtMaintenanceHistoryRepository maintenanceHistoryRepository;
    private final CourtSlotService courtSlotService;
    private final RestTemplate restTemplate;
    private final RedisTemplate<String, String> redisString;
    private final BookingSlotService bookingSlotService;


    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('STAFF')")
    public void addMaintenanceHistory(CourtMaintenanceHistoryRequestDTO dto) {
        CourtSlot courtSlot = courtSlotService.getCourtSlotByCourtSlotId(dto.getCourtSlotId());

        checkBookingConflicts(courtSlot, dto.getStartTime(), dto.getEndTime());

        CourtMaintenanceHistory history = new CourtMaintenanceHistory();
        history.setCourtSlot(courtSlot);
        history.setStartTime(dto.getStartTime());
        history.setEndTime(dto.getEndTime());
        history.setFinishAt(dto.getFinishAt());
        history.setDescription(dto.getDescription());

        maintenanceHistoryRepository.save(history);
        bookingSlotService.deleteBookingSlotsByCourtId(courtSlot.getCourt().getId());
        saveMaintenanceToRedis(courtSlot.getCourt().getId(), courtSlot.getId(), dto.getStartTime(), dto.getEndTime());
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('STAFF')")
    public void updateMaintenanceHistory(CourtMaintenanceHistoryRequestDTO dto) {
        CourtMaintenanceHistory history = maintenanceHistoryRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Maintenance history not found"));

        String courtId = history.getCourtSlot().getCourt().getId();
        String courtSlotId = history.getCourtSlot().getId();

        if(dto.getStatus() == null || dto.getStatus().isEmpty()) throw new ApiException("thiếu trạng thái bảo trì", "STATUS_NULL");

        if (dto.getStatus().equals("Đổi lịch")) {
            checkBookingConflicts(history.getCourtSlot(), dto.getStartTime(), dto.getEndTime());

            // Xóa redis cũ
            deleteMaintenanceFromRedis(courtId, courtSlotId, history.getStartTime(), history.getEndTime());

            // Update thông tin
            history.setStartTime(dto.getStartTime());
            history.setEndTime(dto.getEndTime());
            history.setDescription(dto.getDescription());
            history.setFinishAt(dto.getFinishAt());
            history.setStatus(dto.getStatus());
            maintenanceHistoryRepository.save(history);

            // Lưu redis mới
            saveMaintenanceToRedis(courtId, courtSlotId, dto.getStartTime(), dto.getEndTime());
        } else {
            // Cập nhật trạng thái hoàn thành hoặc hủy
            history.setFinishAt(LocalDateTime.now());
            history.setStatus(dto.getStatus());
            maintenanceHistoryRepository.save(history);

            // Xóa redis cũ
            deleteMaintenanceFromRedis(courtId, courtSlotId, history.getStartTime(), history.getEndTime());

        }
        bookingSlotService.deleteBookingSlotsByCourtId(history.getCourtSlot().getCourt().getId());
    }


    public void finishMaintenance(String maintenanceHistoryId) {
        CourtMaintenanceHistory history = maintenanceHistoryRepository.findById(maintenanceHistoryId)
                .orElseThrow(() -> new RuntimeException("Maintenance history not found"));

        // Cập nhật finishAt
        history.setFinishAt(LocalDateTime.now());
        maintenanceHistoryRepository.save(history);
        bookingSlotService.deleteBookingSlotsByCourtId(history.getCourtSlot().getCourt().getId());
        // Xóa Redis key tương ứng
        deleteMaintenanceFromRedis(
                history.getCourtSlot().getCourt().getId(),
                history.getCourtSlot().getId(),
                history.getStartTime(),
                history.getEndTime()
        );
    }


    private void checkBookingConflicts(CourtSlot courtSlot, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDate startDate = startTime.toLocalDate();
        LocalDate endDate = endTime.toLocalDate();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            LocalDateTime dayStartTime = currentDate.equals(startDate) ? startTime : currentDate.atStartOfDay();
            LocalDateTime dayEndTime = currentDate.equals(endDate) ? endTime : currentDate.atTime(LocalTime.MAX);

            String url = UriComponentsBuilder.fromHttpUrl("http://203.145.46.242:8080/api/identity/public/booked-slots")
                    .queryParam("courtId", courtSlot.getCourt().getId())
                    .queryParam("bookingDate", currentDate)
                    .toUriString();

            ResponseEntity<UpdateBookingSlot> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );

            UpdateBookingSlot bookingSlot = response.getBody();

            if (bookingSlot != null && bookingSlot.getCourtSlotBookings() != null) {
                List<LocalTime> bookedTimes = bookingSlot.getCourtSlotBookings()
                        .getOrDefault(courtSlot.getName(), List.of());

                for (LocalTime bookedTime : bookedTimes) {
                    LocalDateTime bookedDateTime = LocalDateTime.of(currentDate, bookedTime);

                    if (!bookedDateTime.isBefore(dayStartTime) && !bookedDateTime.isAfter(dayEndTime)) {
                        throw new ApiException("CourtSlot '" + courtSlot.getName() +
                                "' đã có booking trong khoảng bảo trì tại thời điểm: " + bookedDateTime, "MAINTENANCE_ERROR");
                    }
                }
            }
            currentDate = currentDate.plusDays(1);
        }
    }

        @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('STAFF')")
    public List<CourtMaintenanceHistoryResponseDTO> getHistoriesByCourtSlotId(String courtSlotId) {
        return maintenanceHistoryRepository.findByCourtSlotIdOrderByStartTimeDesc(courtSlotId)
                .stream()
                .map(history -> {
                    CourtMaintenanceHistoryResponseDTO dto = new CourtMaintenanceHistoryResponseDTO();
                    dto.setId(history.getId());
                    dto.setStartTime(history.getStartTime());
                    dto.setEndTime(history.getEndTime());
                    dto.setFinishAt(history.getFinishAt());
                    dto.setDescription(history.getDescription());
                    dto.setStatus(history.getStatus());
                    return dto;
                })
                .collect(Collectors.toList());
    }


    private void saveMaintenanceToRedis(String courtId, String courtSlotId, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDate startDate = startTime.toLocalDate();
        LocalDate endDate = endTime.toLocalDate();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            LocalTime startOfDay = currentDate.equals(startDate) ? startTime.toLocalTime() : LocalTime.MIN;
            LocalTime endOfDay = currentDate.equals(endDate) ? endTime.toLocalTime() : LocalTime.MAX;

            String key = String.format("maintenance:%s:%s:%s", courtId, courtSlotId, currentDate);
            String value = startOfDay + " - " + endOfDay;

            // Tính TTL
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expireAt = LocalDateTime.of(currentDate, endOfDay);
            long ttlInSeconds = Duration.between(now, expireAt).getSeconds();

            if (ttlInSeconds > 0) {
                redisString.opsForValue().set(key, value, ttlInSeconds, TimeUnit.SECONDS);
            }

            currentDate = currentDate.plusDays(1);
        }
    }
    private void deleteMaintenanceFromRedis(String courtId, String courtSlotId, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDate startDate = startTime.toLocalDate();
        LocalDate endDate = endTime.toLocalDate();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            String key = String.format("maintenance:%s:%s:%s", courtId, courtSlotId, currentDate);
            redisString.delete(key);
            currentDate = currentDate.plusDays(1);
        }
    }

    public Map<String, List<LocalDate>> getMaintenanceCourtSlots(String courtId,
                                                                 List<LocalDate> bookingDates,
                                                                 LocalTime startTime,
                                                                 LocalTime endTime) {
        List<Object[]> maintenanceSlots = maintenanceHistoryRepository.findMaintenanceCourtSlots(
                courtId, bookingDates, startTime, endTime);

        Map<String, List<LocalDate>> invalidCourtSlots = new HashMap<>();

        for (Object[] maintenance : maintenanceSlots) {
            String courtSlotId = (String) maintenance[0];

            Object dateObject = maintenance[1]; // Lấy giá trị ngày
            LocalDate date;

            if (dateObject instanceof java.sql.Date) {
                date = ((java.sql.Date) dateObject).toLocalDate();
            } else if (dateObject instanceof Timestamp) {
                date = ((Timestamp) dateObject).toLocalDateTime().toLocalDate();
            } else {
                throw new IllegalStateException("Unexpected type for date: " + dateObject.getClass());
            }

            invalidCourtSlots.computeIfAbsent(courtSlotId, k -> new ArrayList<>()).add(date);
        }

        return invalidCourtSlots;
    }

    public void checkAndNotifyMaintenance() {
        LocalDate today = LocalDate.now();
        List<CourtMaintenanceHistory> pendingMaintenances =
                maintenanceHistoryRepository.findAllPendingMaintenances("Hoàn thành", today);

        for (CourtMaintenanceHistory maintenance : pendingMaintenances) {
            CourtSlot courtSlot = maintenance.getCourtSlot();
            String courtId = courtSlot.getCourt().getId();
            String courtSlotId = courtSlot.getId();

            sendMaintenanceNotification(courtId, courtSlotId);
        }
    }

    public void sendMaintenanceNotification(String courtId, String courtSlotId) {
        String url = "http://203.145.46.242:8080/api/identity/public/noti/maintenance?courtId=" + courtId + "&courtSlotId=" + courtSlotId;

        ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            System.out.println("Notification sent successfully: " + response.getBody());
        } else {
            System.out.println("Failed to send notification: " + response.getStatusCode());
        }
    }


}

