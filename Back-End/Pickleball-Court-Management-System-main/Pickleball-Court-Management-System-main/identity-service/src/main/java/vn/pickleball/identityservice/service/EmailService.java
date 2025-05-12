package vn.pickleball.identityservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import vn.pickleball.identityservice.dto.request.OrderDetailDto;
import vn.pickleball.identityservice.dto.request.OrderDetailRequest;
import vn.pickleball.identityservice.dto.response.OrderDetailResponse;
import vn.pickleball.identityservice.dto.response.OrderResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@EnableAsync
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Async
    public void sendBookingConfirmationEmail(String to, OrderResponse orderResponse) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("🔔 Xác nhận đặt lịch thành công!");

            // Load template và truyền dữ liệu vào
            Context context = new Context();
            context.setVariable("customerName", orderResponse.getCustomerName());
            context.setVariable("courtName", orderResponse.getCourtName());
            context.setVariable("address", orderResponse.getAddress());

            // Nhóm các OrderDetailResponse theo courtSlotName
            Map<String, List<OrderDetailResponse>> groupedByCourtSlot = new LinkedHashMap<>();
            for (OrderDetailResponse detail : orderResponse.getOrderDetails()) {
                groupedByCourtSlot
                        .computeIfAbsent(detail.getCourtSlotName(), k -> new ArrayList<>())
                        .add(detail);
            }

            context.setVariable("groupedByCourtSlot", groupedByCourtSlot);
            context.setVariable("totalAmount", formatCurrency(orderResponse.getTotalAmount()));
            context.setVariable("amountPaid",
                    orderResponse.getAmountPaid() != null ? formatCurrency(orderResponse.getAmountPaid()) : "Chưa thanh toán"
            );

            // Render email từ template
            String htmlContent = templateEngine.process("order-confirmation", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Send mail error to - {}", to);
//            throw new RuntimeException(e);
        }
    }


    @Async
    public void sendBookingRemindEmail(String to, OrderResponse orderResponse) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("⏰ Nhắc nhở lịch đặt sân!");

            // Load template và truyền dữ liệu vào
            Context context = new Context();
            context.setVariable("customerName", orderResponse.getCustomerName());
            context.setVariable("courtName", orderResponse.getCourtName());
            context.setVariable("address", orderResponse.getAddress());

            // Nhóm các OrderDetailResponse theo courtSlotName
            Map<String, List<OrderDetailResponse>> groupedByCourtSlot = new LinkedHashMap<>();
            for (OrderDetailResponse detail : orderResponse.getOrderDetails()) {
                groupedByCourtSlot
                        .computeIfAbsent(detail.getCourtSlotName(), k -> new ArrayList<>())
                        .add(detail);
            }

            context.setVariable("groupedByCourtSlot", groupedByCourtSlot);
            context.setVariable("totalAmount", formatCurrency(orderResponse.getTotalAmount()));
            context.setVariable("amountPaid",
                    orderResponse.getAmountPaid() != null ? formatCurrency(orderResponse.getAmountPaid()) : "Chưa thanh toán"
            );

            // Render email từ template
            String htmlContent = templateEngine.process("order-remind", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Send mail error to - {}", to);
//            throw new RuntimeException(e);
        }
    }



    @Async
    public void sendRegistrationConfirmationEmail(String to, String phoneNumber, String customerName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("🔔 Xác nhận đăng ký tài khoản");

            // Link xác nhận có UID
            String confirmationUrl = "http://203.145.46.242:8080/api/identity/auth/confirm_student?key=" + phoneNumber;
//            String confirmationUrl = "http://localhost:8081/identity/auth/confirm_student?key=" + phoneNumber;

            // Load template Thymeleaf
            Context context = new Context();
            context.setVariable("customerName", customerName);
            context.setVariable("confirmationUrl", confirmationUrl);

            String htmlContent = templateEngine.process("registration-confirmation", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Lỗi gửi email xác nhận đăng ký đến {} - {}", to, e.getMessage());
        }
    }

    @Async // Xử lý bất đồng bộ
    public void sendNewPasswordEmail(String to, String newPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("🔐 Mật khẩu mới của bạn");

            // Load template email
            Context context = new Context();
            context.setVariable("newPassword", newPassword);
            String htmlContent = templateEngine.process("forgot-password-template", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Send mail error");
        }
    }


    private String formatCurrency(BigDecimal amount) {
        return amount != null ? String.format("%,.0f", amount) : "0";
    }
}
