package vn.pickleball.identityservice.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.pickleball.identityservice.entity.Order;
import vn.pickleball.identityservice.service.NotificationService;
import vn.pickleball.identityservice.service.OrderService;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobScheduler {

    private final OrderService orderService;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0/30 * * * ?")
    private void refund(){
        log.info("Execute refund job");
        List<Order> orders = orderService.getOrderRefund();

        orders.forEach(orderService::refundByJob);
    }

    @Scheduled(cron = "0 */30 * * * ?") // Runs every 30 minutes at :00 and :30
    public void checkUpcomingBookings() {
        try {
            orderService.checkAndSendUpcomingBookingNotifications();
        } catch (Exception e) {
            log.error("Error in scheduled job: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 */30 * * * ?") // Chạy mỗi 30 phút
    public void updateOrderStatuses() {
        log.info("Starting order status update job at {}", LocalDateTime.now());
        try {
            orderService.updateExpiredOrdersStatus();
            log.info("Order status update job completed successfully");
        } catch (Exception e) {
            log.error("Error in order status update job: {}", e.getMessage(), e);
        }
    }
}
