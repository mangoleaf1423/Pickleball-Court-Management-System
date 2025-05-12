package vn.pickleball.courtservice.job;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.pickleball.courtservice.dto.BookingStatus;
import vn.pickleball.courtservice.dto.response.BookingSlotResponse;
import vn.pickleball.courtservice.dto.response.CourtSlotBookingResponse;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Component
@Slf4j
public class BookingSlotScheduler {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String REDIS_KEY_PREFIX = "booking_slots:";

    // Chạy job mỗi 30 phút
    @Scheduled(cron = "0 0/30 * * * ?") // 30 phút
    public void checkAndLockExpiredSlots() {
        log.info("Execute job lock slot");
        LocalDate currentDate = LocalDate.now();
        LocalTime currentTime = LocalTime.now();

        // Tạo pattern để tìm tất cả các key chứa ngày hiện tại
        String redisPattern = REDIS_KEY_PREFIX + "*:" + currentDate.toString();

        // Lấy tất cả các key phù hợp với pattern
        Set<String> keys = redisTemplate.keys(redisPattern);

        if (keys != null) {
            for (String key : keys) {
                // Lấy dữ liệu từ Redis
                Object cachedData = redisTemplate.opsForValue().get(key);
                if (cachedData == null) {
                    continue;
                }

                // Chuyển đổi dữ liệu từ Redis thành List<CourtSlotBookingResponse>
                List<CourtSlotBookingResponse> cachedSlots = objectMapper.convertValue(cachedData, new TypeReference<List<CourtSlotBookingResponse>>() {});

                // Duyệt qua từng CourtSlotBookingResponse
                for (CourtSlotBookingResponse courtSlotBookingResponse : cachedSlots) {
                    List<BookingSlotResponse> bookingSlots = courtSlotBookingResponse.getBookingSlots();

                    // Duyệt qua từng BookingSlotResponse
                    for (BookingSlotResponse slot : bookingSlots) {
                        if (slot.getStatus() == BookingStatus.BOOKED && slot.getEndTime().isBefore(currentTime)) {
                            slot.setStatus(BookingStatus.LOCK_BOOKED);
                        } else if (slot.getStatus() == BookingStatus.AVAILABLE && slot.getEndTime().isBefore(currentTime)){
                            slot.setStatus(BookingStatus.LOCKED);
                        }
                    }
                }

                // Lưu lại vào Redis sau khi cập nhật
                redisTemplate.opsForValue().set(key, cachedSlots);
            }
        }
    }
}
