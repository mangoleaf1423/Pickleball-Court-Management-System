package vn.pickleball.identityservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.identityservice.dto.request.NotiData;
import vn.pickleball.identityservice.dto.request.NotificationRequest;
import vn.pickleball.identityservice.dto.response.NotificationResponse;
import vn.pickleball.identityservice.dto.response.OrderResponse;
import vn.pickleball.identityservice.entity.*;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.mapper.NotificationMapper;
import vn.pickleball.identityservice.mapper.OrderMapper;
import vn.pickleball.identityservice.mapper.OrderMapperCustom;
import vn.pickleball.identityservice.repository.NotificationRepository;
import vn.pickleball.identityservice.repository.OrderRepository;
import vn.pickleball.identityservice.repository.UserRepository;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserService userService;
    private final FCMService fcmService;
    private final EmailService emailService;
    private final OrderMapperCustom orderMapperCustom;

    // Lưu thông báo mới
    public NotificationRequest saveNotification(NotificationRequest request, String phoneNumber) {
        User user = userService.findByPhoneNumber(phoneNumber)
                .orElse(null);

        Notification notification = notificationMapper.toEntity(request);
        notification.setUser(user);
        notification.setPhoneNumber(user != null ? user.getPhoneNumber() : phoneNumber);
        notification.setCreateAt(LocalDateTime.now());
        return notificationMapper.toDto(notificationRepository.save(notification));
    }


    public void sendNotiManagerAndStaff(String title, String des, Order order) {
        List<String> users = userService.getUsersByCourtId(order.getCourtId());

        for (String user : users) {
            List<String> fcmTokens = fcmService.getTokens(user);

            NotificationRequest notificationRequest = NotificationRequest.builder()
                    .title(title)
                    .description(des)
                    .createAt(LocalDateTime.now())
                    .status("send")
                    .notificationData(NotiData.builder()
                            .orderId(order.getId())
                            .build())
                    .build();

            NotificationRequest notification = saveNotificationManagerAndStaff(notificationRequest, userService.findById(user));

            fcmService.sendNotification(fcmTokens, notification);
        }
    }

    public void sendNotiMaintenance(String courtId, String courtSlotId) {
        List<String> users = userService.getUsersByCourtId(courtId);

        for (String user : users) {
            List<String> fcmTokens = fcmService.getTokens(user);

            NotificationRequest notificationRequest = NotificationRequest.builder()
                    .title("Kiểm tra lịch bảo trì")
                    .description("Đến lịch bảo trì , kiểm tra lịch bảo trì")
                    .createAt(LocalDateTime.now())
                    .status("send")
                    .notificationData(NotiData.builder()
                            .orderId(courtSlotId)
                            .build())
                    .build();

            NotificationRequest notification = saveNotificationManagerAndStaff(notificationRequest, userService.findById(user));

            fcmService.sendNotification(fcmTokens, notification);
        }
    }

    public NotificationRequest saveNotificationManagerAndStaff(NotificationRequest request, User user) {

        Notification notification = notificationMapper.toEntity(request);
        notification.setUser(user);
        notification.setPhoneNumber(user.getPhoneNumber());
        notification.setCreateAt(LocalDateTime.now());

        return notificationMapper.toDto(notificationRepository.save(notification));
    }

    // Cập nhật trạng thái thông báo
    public NotificationRequest updateStatus(String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notification not found", "ENTITY_NOTFOUND"));

        notification.setStatus("read");
        return notificationMapper.toDto(notificationRepository.save(notification));
    }

    public NotificationResponse getAllNotifications(String value) {
        List<NotificationRequest> notifications = notificationMapper.toDtoList( notificationRepository.findByUserIdOrPhoneNumber(value));
        Long totalCount = notificationRepository.countByIdOrPhoneNumber(value);
        Long unreadCount = notificationRepository.countUnreadByIdOrPhoneNumber(value);
        return NotificationResponse.builder()
                .notifications(notifications)
                .totalCount(totalCount)
                .unreadCount(unreadCount)
                .build();
    }

    public Long courtUnRead(String value){
        return notificationRepository.countUnreadByIdOrPhoneNumber(value);
    }


    public void processOrderForNotifications(Order order, LocalTime now) {
        // 1. Lọc các chi tiết đặt sân của hôm nay
        List<OrderDetail> todaysDetails = order.getOrderDetails().stream()
                .filter(od -> od.getBookingDates().stream()
                        .anyMatch(bd -> bd.getBookingDate().equals(LocalDate.now())))
                .toList();

        // 2. Tìm chi tiết sớm nhất trong 30 phút tới
        Optional<OrderDetail> upcomingDetail = todaysDetails.stream()
                .filter(od -> {
                    Duration duration = Duration.between(now, od.getStartTime());
                    return !duration.isNegative() && duration.toMinutes() <= 30;
                })
                .min(Comparator.comparing(OrderDetail::getStartTime));

        // 3. Gửi thông báo nếu có
        upcomingDetail.ifPresent(orderDetail -> sendUpcomingBookingNotification(order, orderDetail));
    }

    private void sendUpcomingBookingNotification(Order order, OrderDetail detail) {
        String title = "Bạn có lịch đặt sân sắp tới giờ";
        OrderResponse orderResponse = orderMapperCustom.toOrderResponse(order);
        String description = String.format(
                "Bạn có lịch đặt sân %s sử dụng lúc %s",
                orderResponse.getCourtName(),
                detail.getStartTime()
        );
        sendNoti(title, description, order);

        if (order.getUser() != null) {
            String email = order.getUser().getEmail();
            if (email != null) {
                emailService.sendBookingRemindEmail(email, orderResponse);
            }
        }
    }

    public void sendNoti(String title, String des, Order order) {
        List<String> fcmTokens = order.getUser() != null ? fcmService.getTokens(order.getUser().getId()) : fcmService.getTokens(order.getPhoneNumber());
        if (fcmTokens == null || fcmTokens.isEmpty()) fcmTokens = fcmService.getTokens(order.getPhoneNumber());
        NotificationRequest notificationRequest = NotificationRequest.builder()
                .title(title)
                .description(des)
                .createAt(LocalDateTime.now())
                .status("send")
                .notificationData(NotiData.builder()
                        .orderId(order.getId())
                        .build())
                .build();
        NotificationRequest notification = this.saveNotification(notificationRequest, order.getPhoneNumber());
        fcmService.sendNotification(fcmTokens, notification);
    }



}
