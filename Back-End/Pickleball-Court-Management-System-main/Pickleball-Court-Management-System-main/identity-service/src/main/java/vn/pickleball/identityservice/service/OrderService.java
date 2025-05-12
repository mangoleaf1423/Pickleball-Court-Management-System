package vn.pickleball.identityservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.identityservice.client.CourtClient;
import vn.pickleball.identityservice.client.PaymentClient;
import vn.pickleball.identityservice.dto.BookingStatus;
//import vn.pickleball.identityservice.dto.notification.NotificationResponse;
import vn.pickleball.identityservice.dto.payment.CreateQrRequest;
import vn.pickleball.identityservice.dto.payment.MbVietQrRefundWithAmountRequest;
import vn.pickleball.identityservice.dto.payment.NotificationResponse;
import vn.pickleball.identityservice.dto.request.*;
import vn.pickleball.identityservice.dto.response.*;
import vn.pickleball.identityservice.entity.*;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.mapper.OrderMapper;
import vn.pickleball.identityservice.mapper.OrderMapperCustom;
import vn.pickleball.identityservice.mapper.TransactionMapper;
import vn.pickleball.identityservice.repository.*;
import vn.pickleball.identityservice.utils.GenerateString;
import vn.pickleball.identityservice.utils.SecurityContextUtil;
import vn.pickleball.identityservice.websockethandler.NotificationWebSocketHandler;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final TransactionService transactionService;
    private final OrderMapper orderMapper;
    private final PaymentClient paymentClient;
    private final CourtClient courtClient;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper redisObjectMapper;
    private final ScheduledExecutorService scheduler;
    private final NotificationWebSocketHandler socketHandler;
    private final TransactionMapper transactionMapper;
    private final FCMService fcmService;
    private final NotificationService notificationService;
    private final UserService userService;
    private final EmailService emailService;
    private final OrderDetailService orderDetailService;
    private final BookingDateService bookingDateService;
    private final OrderMapperCustom orderMapperCustom;

    private static final String TRANSACTION_KEY_PREFIX = "transaction:";
    private static final String PREFIX = "bookingslot:";
    private static final String PREFIX_QR = "qrcode:";

    @Value("${payment.api_key}")
    private String apiKey;

    @Value("${payment.client_id}")
    private String clientId;

    @Value("${payment.check_sum}")
    private String checkSum;

    public OrderResponse createOrder(OrderRequest request) {
        if (!GenerateString.isValidSignature(request.getTotalAmount().toString(),
                request.getPaymentAmount().toString(),
                request.getDepositAmount().toString(),
                request.getPhoneNumber(),
                request.getSignature())) {
            throw new ApiException("Payment amount not match", "AMOUNT_NOT_MATCH");
        }

        Order order = orderMapper.toOrderEntity(request);

        order.setPaymentTimeout(LocalDateTime.now().plusMinutes(5));
        order.setTotalAmount(request.getTotalAmount());
        order.setPaymentAmount(request.getPaymentAmount());
        order.setDepositAmount(request.getDepositAmount());
        order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "Đơn ngày");
        order.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "Chưa đặt cọc");
        if (request.getUserId() != null && !request.getUserId().isEmpty()) {
            order.setUser(userService.findById(request.getUserId()));
        }
//        LocalTime latestEndTime = Collections.max(request.getOrderDetails(),
//                        Comparator.comparing(OrderDetailRequest::getEndTime))
//                .getEndTime();
//        order.setSettlementTime(LocalDateTime.of(request.getBookingDate(),latestEndTime.plusHours(1)));

        Double amount = request.getPaymentAmount().doubleValue();
        String billCode = "PM" + GenerateString.generateRandomString(13);

        List<UpdateBookingSlot> updateBookingSlots = orderMapper.toUpdateBookingSlotList(request);
        // Tạo QR thanh toán
        CreateQrRequest qrRequest = CreateQrRequest.builder()
                .billCode(billCode)
                .amount(amount)
                .signature(encrypt(amount, billCode, checkSum))
                .build();
        saveBookingSlot(updateBookingSlots, billCode);
        MbQrCodeResponse qrCodeResponse;
        try {
            qrCodeResponse = paymentClient.createQr(qrRequest, apiKey, clientId);
        } catch (FeignException e) {
            throw new ApiException(e.getMessage(), "API_MB_CREATE_QR_ERROR");
        }
        log.info("send update booking status");
        for (UpdateBookingSlot updateBookingSlot : updateBookingSlots) {
            log.info("Update booking body: {}", updateBookingSlot);
            updateBookingSlot.setStatus(BookingStatus.BOOKED);
            try {
                courtClient.updateBookingSlot(updateBookingSlot);
            } catch (FeignException e) {
                log.error("Failed to update booking slot: {}", updateBookingSlot, e);
                throw new ApiException("Not found scheduler for selected date booking","INVALID_BOOKING_DATE");
            }
        }

        Order savedOrder = orderRepository.save(order);

        TransactionRequest transaction = TransactionRequest.builder()
                .orderId(savedOrder.getId())
                .amount(request.getAmountPaid())
                .paymentStatus(savedOrder.getPaymentStatus())
                .billCode(billCode)
                .build();

        saveTransactionToRedis(transaction);


        // Lên lịch kiểm tra sau 5 phút
        schedulePaymentCheck(billCode);

        OrderResponse response = orderMapperCustom.toOrderResponse(savedOrder);
        response.setQrcode(qrCodeResponse.getQrCode());
        redisTemplate.opsForValue().set(PREFIX_QR + order.getId(), qrCodeResponse.getQrCode(), 6, TimeUnit.MINUTES);
        return response;
    }

    @Transactional
    public OrderResponse changeOrder(OrderRequest request, String oid) {
        // Kiểm tra chữ ký hợp lệ
        if (!GenerateString.isValidSignature(request.getTotalAmount().toString(),
                request.getPaymentAmount().toString(),
                request.getDepositAmount().toString(),
                request.getPhoneNumber(),
                request.getSignature())) {
            throw new ApiException("Payment amount not match", "AMOUNT_NOT_MATCH");
        }

        // Tìm Order theo ID
        Order order = orderRepository.findById(oid)
                .orElseThrow(() -> new ApiException("Not found Order", "ENTITY_NOT_FOUND"));

        if (!order.getOrderStatus().equals("Đặt lịch thành công") &&
                !order.getOrderStatus().equals("Đổi lịch thất bại")) {
            throw new ApiException("Trạng thái đơn không hợp lệ", "INVALID_ORDER");
        }
        BigDecimal amountPaid = order.getAmountPaid();
        // Lấy danh sách booking cũ
        List<UpdateBookingSlot> oldBooking = orderMapper.orderToUpdateBookingSlot(order);

        // Xóa toàn bộ OrderDetail và BookingDate cũ thủ công
        for (OrderDetail detail : order.getOrderDetails()) {
            bookingDateService.deleteByOrderDetailId(detail.getId()); // Xóa BookingDate
        }
        orderDetailService.deleteByOrderId(order.getId());
        order.getOrderDetails().clear();
        // Cập nhật Order từ request
        orderMapper.updateOrderFromRequest(request, order);

        // Cập nhật các thuộc tính bổ sung
        order.setAmountPaid(amountPaid);
        order.setOrderStatus("Thay đổi lịch đặt");
        order.setPaymentTimeout(LocalDateTime.now().plusMinutes(5));
        order.setTotalAmount(request.getTotalAmount());
        order.setPaymentAmount(request.getPaymentAmount());
        order.setDepositAmount(request.getDepositAmount());
        order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "Đơn ngày");
        if (request.getUserId() != null && !request.getUserId().isEmpty()) {
            order.setUser(userService.findById(request.getUserId()));
        }

        // Lưu Order để đồng bộ hóa
        Order savedOrder = orderRepository.saveAndFlush(order);

        // Cập nhật trạng thái booking cũ về AVAILABLE
        log.info("Send update booking status to AVAILABLE");
        for (UpdateBookingSlot updateBookingSlot : oldBooking) {
            updateBookingSlot.setStatus(BookingStatus.AVAILABLE);
            log.info("Update booking body available: {}", updateBookingSlot);
            try {
                courtClient.updateBookingSlot(updateBookingSlot);
            } catch (FeignException e) {
                log.error("Failed to update booking slot: {}", updateBookingSlot, e);
                throw new ApiException("Not found scheduler for selected date booking","CREATE_ORDER_FAIL");
            }
        }

        // Xử lý thanh toán (nếu có)
        if (request.getPaymentAmount() != null && request.getPaymentAmount().compareTo(BigDecimal.ZERO) > 0) {
            savedOrder.setPaymentAmount(request.getPaymentAmount());
            savedOrder.setPaymentStatus(savedOrder.getPaymentStatus() != null ? savedOrder.getPaymentStatus() : "Chưa đặt cọc");
            String billCode = "PM" + GenerateString.generateRandomString(13);
            savedOrder.setPaymentTimeout(LocalDateTime.now().plusMinutes(5));

            CreateQrRequest qrRequest = CreateQrRequest.builder()
                    .billCode(billCode)
                    .amount(request.getPaymentAmount().doubleValue())
                    .signature(encrypt(request.getPaymentAmount().doubleValue(), billCode, checkSum))
                    .build();
            saveBookingSlot(orderMapper.toUpdateBookingSlotList(request), billCode);

            MbQrCodeResponse qrCodeResponse;
            try {
                qrCodeResponse = paymentClient.createQr(qrRequest, apiKey, clientId);
            } catch (FeignException e) {
                throw new ApiException("Failed to create QR", "API_MB_CREATE_QR_ERROR");
            }

            TransactionRequest transaction = TransactionRequest.builder()
                    .orderId(oid)
                    .amount(request.getAmountPaid())
                    .paymentStatus(savedOrder.getPaymentStatus())
                    .billCode(billCode)
                    .build();
            saveTransactionToRedis(transaction);

            schedulePaymentCheck(billCode);

            Order finalOrder = orderRepository.save(savedOrder);
            OrderResponse response = orderMapperCustom.toOrderResponse(finalOrder);
            response.setQrcode(qrCodeResponse.getQrCode());
            redisTemplate.opsForValue().set(PREFIX_QR + finalOrder.getId(), qrCodeResponse.getQrCode(), 6, TimeUnit.MINUTES);

            List<UpdateBookingSlot> updateBookingSlots = orderMapper.orderToUpdateBookingSlot(finalOrder);
            for (UpdateBookingSlot updateBookingSlot : updateBookingSlots) {
                log.info("Update booking body - createQr: {}", updateBookingSlot);
                updateBookingSlot.setStatus(BookingStatus.BOOKED);
                try {
                    courtClient.updateBookingSlot(updateBookingSlot);
                } catch (FeignException e) {
                    log.error("Failed to update booking slot: {}", updateBookingSlot, e);
                    throw new ApiException("Not found scheduler for selected date booking","INVALID_BOOKING_DATE");
                }
            }
            return response;
        } else if (request.getPaymentAmount() != null && request.getPaymentAmount().compareTo(BigDecimal.ZERO) < 0) {
            BigDecimal refundAmount = request.getPaymentAmount().abs();
            if (refundAmount.compareTo(savedOrder.getAmountPaid().subtract(savedOrder.getDepositAmount())) > 0) {
                throw new ApiException("Invalid refund amount", "INVALID_REFUND_AMOUNT");
            }
            try {
                processRefund(savedOrder, refundAmount);
            } catch (ApiException e) {
                throw new ApiException("Refund error", "REFUND_ERROR");
            }
            savedOrder.setPaymentAmount(null);
            savedOrder.setOrderStatus("Thay đổi lịch đặt thành công");

            Order finalOrder = orderRepository.save(savedOrder);
            List<UpdateBookingSlot> updateBookingSlots = orderMapper.orderToUpdateBookingSlot(finalOrder);
            for (UpdateBookingSlot updateBookingSlot : updateBookingSlots) {
                log.info("Update booking body - refund: {}", updateBookingSlot);
                updateBookingSlot.setStatus(BookingStatus.BOOKED);
                try {
                    courtClient.updateBookingSlot(updateBookingSlot);
                } catch (FeignException e) {
                    log.error("Failed to update booking slot: {}", updateBookingSlot, e);
                    throw new ApiException("Not found scheduler for selected date booking","INVALID_BOOKING_DATE");
                }
            }
            return orderMapperCustom.toOrderResponse(finalOrder);
        } else {
            savedOrder.setOrderStatus("Thay đổi lịch đặt thành công");
            Order finalOrder = orderRepository.save(savedOrder);
            List<UpdateBookingSlot> updateBookingSlots = orderMapper.orderToUpdateBookingSlot(finalOrder);
            for (UpdateBookingSlot updateBookingSlot : updateBookingSlots) {
                log.info("Update booking body - no payment: {}", updateBookingSlot);
                updateBookingSlot.setStatus(BookingStatus.BOOKED);
                try {
                    courtClient.updateBookingSlot(updateBookingSlot);
                } catch (FeignException e) {
                    log.error("Failed to update booking slot: {}", updateBookingSlot, e);
                    throw new ApiException("Not found scheduler for selected date booking","INVALID_BOOKING_DATE");
                }
            }
            return orderMapperCustom.toOrderResponse(finalOrder);
        }
    }

    /**
     * Lên lịch kiểm tra thanh toán sau 5 phút
     */
    private void schedulePaymentCheck(String billCode) {
        scheduler.schedule(() -> processPaymentTimeout(billCode), 5, TimeUnit.MINUTES);
    }

    /**
     * Xử lý đơn hàng quá hạn thanh toán
     */
    public void processPaymentTimeout(String billCode) {
        String key = TRANSACTION_KEY_PREFIX + billCode;
        if (!redisTemplate.hasKey(key)) {
            log.info("Payment received, no action needed for billCode: {}", billCode);
            return;
        }

        TransactionRequest transactionRequest = getTransactionRedis(billCode);

        // Cập nhật trạng thái đơn hàng
        Order order = orderRepository.findById(transactionRequest.getOrderId())
                .orElseThrow(() -> new ApiException("Not found Order", "ENTITY_NOT_FOUND"));
        log.info("send websocket");
        socketHandler.sendNotification(NotificationResponse.builder()
                .key(order.getId())
                .resDesc("Not payment")
                .resCode("400")
                .build());


        String orderStatus = order.getOrderStatus().equals("Thay đổi lịch đặt") ? "Đổi lịch thất bại" : "Hủy đặt lịch do quá giờ thanh toán";

        order.setOrderStatus(orderStatus);
        orderRepository.save(order);
        if (order.getOrderStatus().equals("Đặt lịch thành công") || order.getOrderType().equals("Đơn dịch vụ")) {
            notificationService.sendNoti("Thanh toán thất bại", "Đã hết thời gian chờ thanh toán, vui lòng kiểm tra lại đặt lịch.", order);
        } else {
            notificationService.sendNoti(orderStatus.toUpperCase(), "Lịch của bạn đã bị hủy do quá thời gian chờ thanh toán.", order);
        }
        log.info("Order {} has been cancelled due to payment timeout.", order.getId());
        log.info("Update order status");
        // Cập nhật trạng thái sân
        List<UpdateBookingSlot> updateBookingSlots = getBookingSlot(billCode);
        if (order.getOrderType().equals("Đơn ngày")) {
            for (UpdateBookingSlot updateBookingSlot : updateBookingSlots) {
                updateBookingSlot.setStatus(BookingStatus.AVAILABLE);
                log.info("Update booking body: {}", updateBookingSlot);

                try {
                    courtClient.updateBookingSlot(updateBookingSlot);
                } catch (FeignException e) {
                    log.error("Failed to update booking slot: {}", updateBookingSlot, e);
                    throw new ApiException("Not found scheduler for selected date booking","INVALID_BOOKING_DATE");
                }
            }
        }
    }

    public void paymentNotification(NotificationResponse response) {
        try {
            log.info("Notification payment response - {}", response.getData());
            BigDecimal amount = new BigDecimal(response.getData().getDebitAmount());
            TransactionRequest transactionRequest = getTransactionRedis(response.getData().getReferenceLabelCode());
            Order order = orderRepository.findById(transactionRequest.getOrderId()).orElseThrow(() -> new ApiException("Not found Order", "ENTITY_NOT_FOUND"));
            String orderStatus = order.getOrderStatus();
            if(order.getOrderType().equals("Đơn dịch vụ")) {
                orderStatus = orderStatus + " thành công";
            }else {
                orderStatus = order.getOrderStatus().equals("Thay đổi lịch đặt") ? "Thay đổi lịch đặt thành công" : "Đặt lịch thành công";
            }
            String paymentStatus = order.getPaymentStatus().equals("Chưa đặt cọc") ? "Đã đặt cọc" : "Đã thanh toán";
            order.setOrderStatus(orderStatus);
            order.setPaymentStatus(paymentStatus);
            order.setAmountPaid(order.getAmountPaid() != null ? order.getAmountPaid().add(amount) : amount);
            orderRepository.save(order);
            socketHandler.sendNotification(NotificationResponse.builder()
                    .key(order.getId())
                    .resDesc("Payment successfully")
                    .resCode("200")
                    .build());
            Transaction transaction = Transaction.builder()
                    .order(order)
                    .amount(amount)
                    .paymentStatus(paymentStatus)
                    .billCode(response.getData().getReferenceLabelCode())
                    .ftCode(response.getData().getFtCode())
                    .createDate(LocalDateTime.now())
                    .build();
            transactionService.saveTransaction(transaction);
            if (order.getUser() != null && !order.getOrderType().equals("Đơn cố định")) {
                String email = order.getUser().getEmail();
                if (email != null) {
                    emailService.sendBookingConfirmationEmail(email, orderMapperCustom.toOrderResponse(order));
                }
            }

            if (order.getOrderType().equals("Đơn cố định")) {
                courtClient.synchronous(order.getCourtId());
            }
            if (order.getOrderStatus().equals("Thay đổi lịch đặt thành công")) {
                notificationService.sendNoti(orderStatus.toUpperCase(), "Thanh toán đặt lịch thành công, vui lòng kiểm tra lịch đặt và đến sân đúng giờ", order);
            } else if (order.getOrderType().equals("Đơn dịch vụ")) {
                try {
                    List<ServiceDetailEntity> serviceDetailEntities = order.getServiceDetails();
                    courtClient.updateAfterPurchase(orderMapper.toPurchaseRequestList(serviceDetailEntities));
                }catch (FeignException e){
                    throw new ApiException("Fail to update quantity", "ERROR_UPDATE_QUANTITY");
                }
                notificationService.sendNotiManagerAndStaff("BẠN CÓ " + orderStatus.toUpperCase(), "Bạn có đơn đặt mới của khách , kiểm tra yêu cầu của khách", order);
            } else {
                notificationService.sendNoti(orderStatus.toUpperCase(), "Cảm ơn bạn đã đặt lịch , vui lòng kiểm tra lịch đặt và đến sân đúng giờ", order);
                notificationService.sendNotiManagerAndStaff("BẠN CÓ " + orderStatus.toUpperCase(), "Bạn có lịch đặt mới hãy kiểm tra lịch đặt của khách", order);
            }
            deleteTransactionRedis(response.getData().getReferenceLabelCode());
            redisTemplate.delete(PREFIX_QR + order.getId());
        } catch (Exception e) {
            throw new ApiException("NOTIFY_PAYMENT_FAIL", "Fail on process in payment service!");
        }

    }


//    public void paymentNotification(PaymentData paymentData){
//        TransactionRequest transactionRequest = getTransactionRedis(paymentData.getBillCode());
//        Order order = orderRepository.findById(transactionRequest.getOrderId()).orElseThrow(() -> new ApiException("Not found Order", "ENTITY_NOT_FOUND"));
//        order.setOrderStatus("Đặt lịch thành công");
//        String paymentStatus = order.getPaymentStatus().equals("Chưa đặt cọc") ? "Đã đặt cọc" : "Đã thanh toán";
//        order.setPaymentStatus(paymentStatus);
//        orderRepository.save(order);
//        socketHandler.sendNotification(NotificationResponse.builder()
//                        .key(order.getId())
//                        .resDesc("Payment successfully")
//                        .resCode("200")
//                .build());
//        Transaction transaction = Transaction.builder()
//                .order(order)
//                .amount(transactionRequest.getAmount())
//                .paymentStatus(paymentStatus)
//                .billCode(paymentData.getBillCode())
//                .ftCode(paymentData.getFtCode())
//                .createDate(LocalDateTime.now())
//                .status("Success")
//                .build();
//        transactionRepository.save(transaction);
//        if(order.getUser() != null){
//            String email = order.getUser().getEmail();
//            if(email != null){
////                try {
//                    emailService.sendBookingConfirmationEmail(email,orderMapper.toResponse(order));
////                } catch (MessagingException e) {
////                    log.error("Send email to {} error - message - {}" , email, e.getMessage());
////                }
//            }
//        }
//
////        sendNoti("ĐẶT LỊCH THÀNH CÔNG","Cảm ơn bạn đã đặt lịch , vui lòng kiểm tra lịch đặt và đến sân đúng giờ", order );
//        deleteTransactionRedis(paymentData.getBillCode());
//    }



    public static String encrypt(Double amount, String billCode, String checksumKey) {
        try {
            String input = amount + "|" + billCode;

            SecretKeySpec secretKeySpec = new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);

            byte[] hmacBytes = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));

            return Base64.getEncoder().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error while encrypting with HMAC");
        }
    }

    public void saveTransactionToRedis(TransactionRequest transaction) {
        try {
            String key = TRANSACTION_KEY_PREFIX + transaction.getBillCode();
            String value = redisObjectMapper.writeValueAsString(transaction);
            redisTemplate.opsForValue().set(key, value, 6, TimeUnit.MINUTES);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize transaction", e);
        }
    }

    public TransactionRequest getTransactionRedis(String billcode) {
        try {
            String key = TRANSACTION_KEY_PREFIX + billcode;
            String value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                return redisObjectMapper.readValue(value, TransactionRequest.class);
            }
            return null;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize transaction", e);
        }
    }

    public void deleteTransactionRedis(String billcode) {
        String key = TRANSACTION_KEY_PREFIX + billcode;
        redisTemplate.delete(key);
    }

    public void saveBookingSlot(List<UpdateBookingSlot> bookingSlots, String billCode) {
        try {
            String key = PREFIX + billCode;
            String value = redisObjectMapper.writeValueAsString(bookingSlots);
            redisTemplate.opsForValue().set(key, value, 6, TimeUnit.MINUTES);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize booking slots", e);
        }
    }

    // Get List<UpdateBookingSlot> from Redis
    public List<UpdateBookingSlot> getBookingSlot(String billCode) {
        try {
            String key = PREFIX + billCode;
            String value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                return redisObjectMapper.readValue(value, new TypeReference<List<UpdateBookingSlot>>() {
                });
            }
            return Collections.emptyList(); // Trả về danh sách rỗng nếu không tìm thấy
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize booking slots", e);
        }
    }

    public List<OrderResponse> getOrders(String value) {
        List<Order> orders;

        orders = orderRepository.findByPhoneNumberOrUserId(value);

        return orderMapperCustom.toOrderResponses(orders);
    }

    public OrderResponse getOrderById(String oid) {
        OrderResponse response = orderMapperCustom.toOrderResponse(orderRepository.findById(oid).orElseThrow(() -> new ApiException("Not found Order", "ENTITY_NOT_FOUND")));
        response.setQrcode(redisTemplate.opsForValue().get(PREFIX_QR + oid));
        return response;
    }

    public OrderResponse cancelOrder(String orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException("Not found Order", "ENTITY_NOT_FOUND"));

//        if(order.getPaymentTimeout().isAfter(LocalDateTime.now())){
//            throw  new ApiException("Order was timeout", "ORDER_TIMEOUT");
//        }

        if(order.getOrderStatus().equals("Đã sử dụng lịch đặt") || order.getOrderStatus().equals("Đã hoàn thành")) throw new ApiException("Không thể hủy lịch vì đã sử dụng dịch vụ", "ORDER_INVALID");
        if(order.getOrderType().equals("Đơn cố định")){
            if (order.getPaymentStatus().equals("Chưa thanh toán")) {
                order.setOrderStatus("Hủy đặt lịch");
                orderRepository.save(order);
                notificationService.sendNoti("HỦY LỊCH ĐẶT THÀNH CÔNG", "Lịch đặt của bạn đã được hủy.", order);
                notificationService.sendNotiManagerAndStaff("KHÁCH HÀNG ĐÃ HỦY LỊCH ĐẶT", "Kiểm tra lại lịch đặt và hoàn tiền nếu có", order);
//                deleteTransactionRedis(order.getBillCode());
                return orderMapperCustom.toOrderResponse(order);
            }else {
                throw new ApiException("Không thể hủy lịch cố định", "ORDER_INVALID");
            }

        }
        order.setOrderStatus("Hủy đặt lịch");
        order.setPaymentStatus(order.getPaymentStatus().equals("Chưa đặt cọc") ? "Chưa đặt cọc" : order.getPaymentStatus());
        if (order.getAmountPaid() != null && order.getAmountPaid().compareTo(order.getDepositAmount()) > 0) {
            try {
                processRefund(order, order.getPaymentAmount().subtract(order.getDepositAmount()));
            } catch (Exception e) {
                throw new ApiException("Refund error", "REFUND_ERROR");
            }
        }


        for (UpdateBookingSlot updateBookingSlot : orderMapper.orderToUpdateBookingSlot(order)) {
            updateBookingSlot.setStatus(BookingStatus.AVAILABLE);
            log.info("Update booking body: {}", updateBookingSlot);

            try {
                courtClient.updateBookingSlot(updateBookingSlot);
            } catch (FeignException e) {
                log.error("Failed to update booking slot: {}", updateBookingSlot, e);
                throw new RuntimeException("Failed to update booking slot: " + e.getMessage());
            }
        }
        orderRepository.save(order);
        notificationService.sendNoti("HỦY LỊCH ĐẶT THÀNH CÔNG", "Lịch đặt của bạn đã được hủy.", order);
        notificationService.sendNotiManagerAndStaff("KHÁCH HÀNG ĐÃ HỦY LỊCH ĐẶT", "Kiểm tra lại lịch đặt và hoàn tiền nếu có", order);
//        deleteTransactionRedis(order.getBillCode());
        return orderMapperCustom.toOrderResponse(order);
    }

    public void testFcm(String key) {
        NotificationRequest notificationRequest = NotificationRequest.builder()
                .title("test")
                .description("test")
                .createAt(LocalDateTime.now())
                .status("send")
                .build();
        fcmService.sendNotification(fcmService.getTokens(key), notificationRequest);

    }

    //    @PreAuthorize("hasRole('ADMIN')")
    public void refund(MbVietQrRefundWithAmountRequest refundWithAmountRequest) {
        try {
            paymentClient.refund(refundWithAmountRequest, apiKey, clientId);
        } catch (FeignException e) {
            throw new ApiException("Failed to refund", "API_MB_REFUND_ERROR");
        }
    }


    public UpdateBookingSlot getBookedSlot(String courtId, LocalDate bookingDate) {
        List<String> statuses = Arrays.asList("Đặt lịch thành công", "Thay đổi lịch đặt thành công" , "Đã hoàn thành" , "Đã sử dụng lịch đặt" , "Không sử dụng lịch đặt");
        List<Order> orders = orderRepository.findByOrderStatusInAndCourtIdAndBookingDate(statuses, courtId, bookingDate);
        if (orders == null || orders.isEmpty()) {
            return null;
        }
        return orderMapper.mapToUpdateBookingSlot(orders, bookingDate);
    }


    public List<Order> getOrderRefund() {
        return orderRepository.findByPaymentStatus("Đợi hoàn tiền");
    }


    public void refundByJob(Order order) {
        try {
            BigDecimal amountPaid = Optional.ofNullable(order.getAmountPaid()).orElse(BigDecimal.ZERO);
            BigDecimal depositAmount = Optional.ofNullable(order.getDepositAmount()).orElse(BigDecimal.ZERO);

            processRefund(order, amountPaid.subtract(depositAmount));
        } catch (ApiException e) {
            log.error("Refund error - {}", order.getId());
        }
        orderRepository.save(order);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public void refundByAdmin(String orderId, BigDecimal refundAmount) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException("Not found Order", "ENTITY_NOT_FOUND"));
        if (refundAmount == null) {
            BigDecimal amount = order.getAmountPaid().subtract(order.getDepositAmount());
            if (amount.compareTo(BigDecimal.ZERO) <= 0) throw new ApiException("Invalid amount", "REFUND_ERROR");
            try {
                processRefund(order, amount);
            } catch (ApiException e) {
                throw new ApiException("Refund error", "REFUND_ERROR");
            }
        } else {
            if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) throw new ApiException("Invalid amount", "REFUND_ERROR");
            try {
                processRefund(order, refundAmount);
            } catch (ApiException e) {
                throw new ApiException("Refund error", "REFUND_ERROR");
            }
        }


    }

    public void processRefund(Order order, BigDecimal refundAmount) {

        // Lấy danh sách transactions cần refund đã được tính toán trước
        List<Transaction> refundTransactions;
        try {
            refundTransactions = findRefundTransactionsByBillCode(order.getId(), refundAmount);
        } catch (ApiException e) {
            saveRefundFailure(order);
            throw e;
        }

        try {
            refundTransactionsAndLog(refundTransactions, refundAmount, order);
            saveRefundSuccess(order, refundAmount);
        } catch (ApiException e) {
            saveRefundFailure(order);
            throw e;
        }
    }

    public void refundTransactionsAndLog(List<Transaction> refundTransactions, BigDecimal refundAmount, Order order) {
        BigDecimal remainingRefund = refundAmount;

        for (Transaction transaction : refundTransactions) {
            if (remainingRefund.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal refundForTransaction = transaction.getAmount().min(remainingRefund);

            MbVietQrRefundWithAmountRequest refundRequest = MbVietQrRefundWithAmountRequest.builder()
                    .amount(refundForTransaction.toString())
                    .billCode(transaction.getBillCode())
                    .build();

            try {
                // Thực hiện refund cho transaction
                refund(refundRequest);
                remainingRefund = remainingRefund.subtract(refundForTransaction);

                // Lưu transaction log hoàn tiền cho từng giao dịch
                Transaction refundLog = Transaction.builder()
                        .order(order)
                        .amount(refundForTransaction)
                        .paymentStatus("Hoàn tiền")
                        .billCode(transaction.getBillCode())
                        .createDate(LocalDateTime.now())
                        .build();
                transactionService.saveTransaction(refundLog);

            } catch (ApiException e) {
                throw new ApiException("Refund thất bại cho billCode: " + transaction.getBillCode(), "API_MB_REFUND_ERROR");
            }
        }

        if (remainingRefund.compareTo(BigDecimal.ZERO) > 0) {
            throw new ApiException("Không thể hoàn đủ số tiền mong muốn. Còn thiếu: " + remainingRefund, "REFUND_AMOUNT_NOT_FULLFILLED");
        }
    }

    public void saveRefundFailure(Order order) {
        order.setPaymentStatus("Hoàn tiền thất bại");
        notificationService.sendNoti("HOÀN TIỀN THẤT BẠI", "Vui lòng liên hệ chúng tôi để được hỗ trợ.", order);
        notificationService.sendNotiManagerAndStaff("HOÀN TIỀN THẤT BẠI", "Kiểm tra đơn hàng và trạng thái hoàn tiền", order);
    }

    public void saveRefundSuccess(Order order, BigDecimal refundAmount) {
        order.setPaymentStatus("Đã hoàn tiền");
        order.setAmountRefund(refundAmount);
        notificationService.sendNoti("HOÀN TIỀN THÀNH CÔNG", "Chúng tôi đã hoàn " + refundAmount + ", vui lòng kiểm tra tài khoản.", order);
        notificationService.sendNotiManagerAndStaff("HOÀN TIỀN THÀNH CÔNG", "Kiểm tra đơn hàng và số tiền đã hoàn", order);
    }


    public List<Transaction> findRefundTransactionsByBillCode(String orderId, BigDecimal refundAmount) {
        List<Transaction> transactions = findUniqueBillCodeTransactions(orderId);

        if (transactions.isEmpty()) {
            throw new ApiException("Không tìm thấy transaction nào hợp lệ theo orderId: " + orderId, "CANNOT_REFUND");
        }

        // Tính tổng amount
        BigDecimal totalAmount = transactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAmount.compareTo(refundAmount) < 0) {
            throw new ApiException("Tổng amount nhỏ hơn refundAmount, không thể hoàn refund.", "CANNOT_REFUND");
        }

        // 1. Transaction amount = refundAmount
        Optional<Transaction> exactMatch = transactions.stream()
                .filter(t -> t.getAmount().compareTo(refundAmount) == 0)
                .findFirst();

        if (exactMatch.isPresent()) {
            return List.of(exactMatch.get());
        }

        // 2. Gần nhất
        Transaction closestTransaction = transactions.stream()
                .min(Comparator.comparing(t -> t.getAmount().subtract(refundAmount).abs()))
                .orElse(null);

        if (closestTransaction != null && closestTransaction.getAmount().compareTo(refundAmount) > 0) {
            return List.of(closestTransaction);
        }

        // 3. Tìm tổ hợp gần nhất
        List<Transaction> bestCombination = findBestCombination(transactions, refundAmount);

        if (bestCombination.isEmpty()) {
            throw new ApiException("Không thể refund", "CANNOT_REFUND");
        }

        return bestCombination;
    }


    private List<Transaction> findBestCombination(List<Transaction> transactions, BigDecimal targetAmount) {
        List<Transaction> bestCombination = new ArrayList<>();
        findBestCombinationHelper(transactions, 0, targetAmount, new ArrayList<>(), bestCombination);
        return bestCombination;
    }

    private void findBestCombinationHelper(List<Transaction> transactions, int index, BigDecimal targetAmount,
                                           List<Transaction> currentList, List<Transaction> bestCombination) {
        BigDecimal currentSum = currentList.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (currentSum.compareTo(targetAmount) <= 0) {
            if (bestCombination.isEmpty() ||
                    currentSum.subtract(sum(bestCombination)).abs().compareTo(targetAmount.subtract(sum(bestCombination)).abs()) < 0) {
                bestCombination.clear();
                bestCombination.addAll(new ArrayList<>(currentList));
            }
        }

        if (index == transactions.size()) {
            return;
        }

        // Không chọn transaction hiện tại
        findBestCombinationHelper(transactions, index + 1, targetAmount, currentList, bestCombination);

        // Chọn transaction hiện tại
        currentList.add(transactions.get(index));
        findBestCombinationHelper(transactions, index + 1, targetAmount, currentList, bestCombination);
        currentList.remove(currentList.size() - 1);
    }

    private BigDecimal sum(List<Transaction> transactions) {
        return transactions.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }


    public List<Transaction> findUniqueBillCodeTransactions(String orderId) {
        List<Transaction> transactions = transactionService.findByOrderId(orderId);

        // Đếm số lần xuất hiện của mỗi billCode
        Map<String, Long> billCodeCount = transactions.stream()
                .filter(t -> t.getBillCode() != null)
                .collect(Collectors.groupingBy(Transaction::getBillCode, Collectors.counting()));

        // Lọc các transaction có billCode chỉ xuất hiện 1 lần và sort theo amount DESC
        return transactions.stream()
                .filter(t -> t.getBillCode() != null && billCodeCount.get(t.getBillCode()) == 1)
                .sorted(Comparator.comparing(Transaction::getAmount).reversed())
                .toList();
    }


    /**
     * Kiểm tra những courtSlot nào bị Order hoặc Maintenance
     */
    public Map<String, Object> getInvalidCourtSlots(String courtId,
                                                    List<LocalDate> bookingDates,
                                                    LocalTime startTime,
                                                    LocalTime endTime) {
        // Lấy danh sách lịch bảo trì từ FeignClient
        Map<String, List<LocalDate>> maintenanceCourtSlots = courtClient.getInvalidCourtSlots(
                CheckValidMaintenance.builder()
                        .courtId(courtId)
                        .bookingDates(bookingDates)
                        .startTime(startTime)
                        .endTime(endTime)
                        .build()).getBody();

        // Lấy danh sách lịch đã đặt từ orderRepository
        List<Object[]> bookedSlots = orderRepository.findBookedCourtSlots(
                courtId, bookingDates, startTime, endTime, Arrays.asList("Đặt lịch thành công", "Thay đổi lịch đặt thành công", "Đã hoàn thành" , "Đã sử dụng lịch đặt" , "Không sử dụng lịch đặt"));

        // Kết hợp lịch bảo trì & lịch đã đặt vào invalidCourtSlots
        Map<String, List<LocalDate>> invalidCourtSlots = new HashMap<>();

        // Thêm lịch bảo trì vào invalidCourtSlots
        if (maintenanceCourtSlots != null && !maintenanceCourtSlots.isEmpty()) {
            maintenanceCourtSlots.forEach((courtSlotId, dates) ->
                    invalidCourtSlots.computeIfAbsent(courtSlotId, k -> new ArrayList<>()).addAll(dates)
            );
        }

        // Thêm lịch đã đặt vào invalidCourtSlots
        for (Object[] booking : bookedSlots) {
            String courtSlotId = (String) booking[0];
            LocalDate date = (LocalDate) booking[1];
            invalidCourtSlots.computeIfAbsent(courtSlotId, k -> new ArrayList<>()).add(date);
        }

        List<CourtSlotMap> courtSlotMaps = courtClient.getCourtSlotMap(courtId).getBody();

        Map<String, List<LocalDate>> invalidCourtSlotsByName = invalidCourtSlots.entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> courtSlotMaps.stream()
                                .filter(courtSlot -> courtSlot.getCourtSlotId().equals(entry.getKey()))
                                .findFirst()
                                .map(CourtSlotMap::getCourtSlotName)
                                .orElse(entry.getKey()),
                        Map.Entry::getValue
                ));

        // Lấy danh sách CourtSlot khả dụng
        List<String> availableCourtSlots = courtClient.getCourtSlotIdsByCourtId(courtId).getBody()
                .stream()
                .filter(slotName -> !invalidCourtSlotsByName.containsKey(slotName))
                .collect(Collectors.toList());



        // Trả về cả danh sách slot không hợp lệ & hợp lệ
        Map<String, Object> response = new HashMap<>();
        response.put("invalidCourtSlots", invalidCourtSlotsByName);
        response.put("availableCourtSlots", availableCourtSlots);

        return response;
    }


    /**
     * Lấy danh sách các ngày thuộc những thứ người dùng đã chọn trong khoảng startDate - endDate
     */
    public List<LocalDate> getBookingDatesFromDaysOfWeek(LocalDate startDate, LocalDate endDate, String daysOfWeek) {
        Set<DayOfWeek> selectedDays = Arrays.stream(daysOfWeek.split(","))
                .map(String::trim)
                .map(DayOfWeek::valueOf)
                .collect(Collectors.toSet());

        List<LocalDate> bookingDates = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            if (selectedDays.contains(currentDate.getDayOfWeek())) {
                bookingDates.add(currentDate);
            }
            currentDate = currentDate.plusDays(1);
        }

        if (bookingDates.isEmpty()) {
            throw new ApiException("Not found date booking in date range", "INVALID_DATE");
        }

        return bookingDates;
    }

    //    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OrderResponse createFixedBooking(FixedBookingRequest request) {
        // Tạo đơn hàng
        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setPhoneNumber(request.getPhoneNumber());
        order.setCourtId(request.getCourtId());
        order.setOrderStatus("Đang xử lý");
        order.setPaymentTimeout(LocalDateTime.now().plusMinutes(5));
        order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "Đơn cố định");
        order.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "Chưa thanh toán");
        order.setNote(request.getNote());
        if (request.getUserId() != null && !request.getUserId().isEmpty()) {
            order.setUser(userService.findById(request.getUserId()));
        }

        // Lưu order trước để có ID
        order = orderRepository.save(order);

        // Prepare OrderDetails
        List<LocalDate> bookingDates = getBookingDatesFromDaysOfWeek(
                request.getStartDate(), request.getEndDate(), request.getSelectedDays()
        );

        List<CourtSlotMap> courtSlotMaps = courtClient.getCourtSlotMap(request.getCourtId()).getBody();

        List<OrderDetail> allOrderDetails = new ArrayList<>();

        for (String courtSlotName : request.getSelectedCourtSlots()) {
            String courtSlotId = courtSlotMaps.stream()
                    .filter(map -> map.getCourtSlotName().equals(courtSlotName))
                    .map(CourtSlotMap::getCourtSlotId)
                    .findFirst()
                    .orElseThrow(() -> new ApiException("Not found courtSlotName", "INVALID_COURTSLOTNAME"));

            // Fixed dates
            List<LocalDate> fixedDates = bookingDates.stream()
                    .filter(date -> request.getFlexibleCourtSlotFixes() == null ||
                            !request.getFlexibleCourtSlotFixes().containsKey(date.toString()))
                    .collect(Collectors.toList());

            if (!fixedDates.isEmpty()) {
                OrderDetail orderDetail = new OrderDetail();
                orderDetail.setOrder(order);
                orderDetail.setCourtSlotId(courtSlotId);
                orderDetail.setStartTime(request.getStartTime());
                orderDetail.setEndTime(request.getEndTime());
                orderDetail.setPrice(null);

                List<BookingDate> fixedBookingDates = new ArrayList<>();
                for (LocalDate date : fixedDates) {
                    BookingDate bookingDate = new BookingDate();
                    bookingDate.setBookingDate(date);
                    bookingDate.setOrderDetail(orderDetail);
                    fixedBookingDates.add(bookingDate);
                }
                orderDetail.setBookingDates(fixedBookingDates);
                allOrderDetails.add(orderDetail);
            }

            // Flexible dates
            if (request.getFlexibleCourtSlotFixes() != null) {
                for (Map.Entry<String, String> entry : request.getFlexibleCourtSlotFixes().entrySet()) {
                    LocalDate conflictDate = LocalDate.parse(entry.getKey());
                    String fixedCourtSlotName = entry.getValue();
                    String fixedCourtSlotId = courtSlotMaps.stream()
                            .filter(map -> map.getCourtSlotName().equals(fixedCourtSlotName))
                            .map(CourtSlotMap::getCourtSlotId)
                            .findFirst()
                            .orElseThrow(() -> new ApiException("Not found courtSlotName", "INVALID_COURTSLOTNAME"));

                    OrderDetail flexibleDetail = new OrderDetail();
                    flexibleDetail.setOrder(order);
                    flexibleDetail.setCourtSlotId(fixedCourtSlotId);
                    flexibleDetail.setStartTime(request.getStartTime());
                    flexibleDetail.setEndTime(request.getEndTime());
                    flexibleDetail.setPrice(null);

                    BookingDate bookingDate = new BookingDate();
                    bookingDate.setBookingDate(conflictDate);
                    bookingDate.setOrderDetail(flexibleDetail);

                    flexibleDetail.setBookingDates(new ArrayList<>(Collections.singletonList(bookingDate)));
                    allOrderDetails.add(flexibleDetail);
                }
            }
        }

        orderDetailService.saveAll(allOrderDetails);

        BigDecimal amount = courtClient.calculateTotalPayment(BookingPaymentRequest.builder()
                .courtId(request.getCourtId())
                .bookingDates(bookingDates)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build()).multiply(BigDecimal.valueOf(request.getSelectedCourtSlots().size()));
        String billCode = "PM" + GenerateString.generateRandomString(13);
        order.setPaymentAmount(amount);
        order.setTotalAmount(amount);
        order = orderRepository.save(order);
        order.setOrderDetails(allOrderDetails);
        CreateQrRequest qrRequest = CreateQrRequest.builder()
                .billCode(billCode)
                .amount(amount.doubleValue())
                .signature(encrypt(amount.doubleValue(), billCode, checkSum))
                .build();

        MbQrCodeResponse qrCodeResponse;
        try {
            qrCodeResponse = paymentClient.createQr(qrRequest, apiKey, clientId);
        } catch (FeignException e) {
            throw new ApiException(e.getMessage(), "API_MB_CREATE_QR_ERROR");
        }
        log.info("send update booking status");

        TransactionRequest transaction = TransactionRequest.builder()
                .orderId(order.getId())
                .amount(amount)
                .paymentStatus(order.getPaymentStatus())
                .billCode(billCode)
                .build();

        saveTransactionToRedis(transaction);
        schedulePaymentCheck(billCode);

        OrderResponse response = orderMapperCustom.toOrderResponse(order);
        response.setQrcode(qrCodeResponse.getQrCode());
        redisTemplate.opsForValue().set(PREFIX_QR + order.getId(), qrCodeResponse.getQrCode(), 6, TimeUnit.MINUTES);
        return response;
    }

    public BigDecimal getPaymentAmount(String courtId, List<LocalDate> dates, LocalTime start, LocalTime end) {
        return courtClient.calculateTotalPayment(BookingPaymentRequest.builder()
                .courtId(courtId)
                .bookingDates(dates)
                .startTime(start)
                .endTime(end)
                .build());
    }

    public String createPaymentOrder(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ApiException("Not found Order", "ENTITY_NOT_FOUND"));


        if (order.getAmountPaid().subtract(order.getTotalAmount()).compareTo(BigDecimal.ZERO) >= 0)
            throw new ApiException("payment amount of order invalid", "ORDER_INVALID");

        BigDecimal amount = order.getTotalAmount().subtract(order.getAmountPaid());
        String billCode = "PM" + GenerateString.generateRandomString(13);
        CreateQrRequest qrRequest = CreateQrRequest.builder()
                .billCode(billCode)
                .amount(amount.doubleValue())
                .signature(encrypt(amount.doubleValue(), billCode, checkSum))
                .build();

        MbQrCodeResponse qrCodeResponse;
        try {
            qrCodeResponse = paymentClient.createQr(qrRequest, apiKey, clientId);
        } catch (FeignException e) {
            throw new ApiException(e.getMessage(), "API_MB_CREATE_QR_ERROR");
        }
        log.info("send update booking status");

        TransactionRequest transaction = TransactionRequest.builder()
                .orderId(order.getId())
                .amount(amount)
                .paymentStatus(order.getPaymentStatus())
                .billCode(billCode)
                .build();

        saveTransactionToRedis(transaction);
        schedulePaymentCheck(billCode);

        redisTemplate.opsForValue().set(PREFIX_QR + order.getId(), qrCodeResponse.getQrCode(), 6, TimeUnit.MINUTES);
        return qrCodeResponse.getQrCode();
    }


    public OrderPage getOrdersByFilterByStaff(
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            String phoneNumber,
            String customerName,
            List<String> filterStatuses,
            int page,
            int size) {

        // Default statuses if not provided
        List<String> defaultStatuses = Arrays.asList(
                "Đặt lịch thành công",
                "Thay đổi lịch đặt thành công",
                "Đã hoàn thành",
                "Đã sử dụng lịch đặt",
                "Không sử dụng lịch đặt"
        );

        // Use provided statuses or default
        List<String> statuses = filterStatuses != null && !filterStatuses.isEmpty()
                ? filterStatuses
                : defaultStatuses;

        // Default to current date if bookingDate is null
        LocalDate effectiveBookingDate = bookingDate != null
                ? bookingDate
                : LocalDate.now();

        // Create Pageable object for pagination
        Pageable pageable = PageRequest.of(page - 1, size);

        // Query orders with filters
        Page<Order> orders = orderRepository.findOrdersWithFiltersByStaff(
                effectiveBookingDate,
                getCourtIdManage(),
                statuses,
                startTime,
                endTime,
                phoneNumber,
                customerName,
                pageable
        );

        List<OrderData> orderData = orderMapperCustom.toOrderDataList(orders.getContent());

        return OrderPage.builder()
                .orders(orderData)
                .totalElements(orders.getTotalElements())
                .totalPages(orders.getTotalPages())
                .build();
    }


    private List<String> getCourtIdManage (){
        return userService.getCourtsByUserId(SecurityContextUtil.getUid());
    }

    public OrderResponse checkin(String orderId){
        Order order = orderRepository.findByIdAndStatuses(
                        orderId,
                Arrays.asList(
                        "Đặt lịch thành công",
                        "Thay đổi lịch đặt thành công"),
                        "Đã thanh toán")
                .orElseThrow(() -> new ApiException("Order không hợp lệ hoặc không đủ điều kiện","ORDER_INVALID"));

        order.setOrderStatus("Đã sử dụng lịch đặt");
        orderRepository.save(order);

        return orderMapperCustom.toOrderResponse(order);
    }

    public void updateExpiredOrdersStatus() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        // 1. Xử lý các order chưa sử dụng
        processUnusedOrders(today, currentTime);

        // 2. Xử lý các order đã sử dụng
        processUsedOrders(today, currentTime);
    }

    private void processUnusedOrders(LocalDate today, LocalTime currentTime) {
        // Lấy các order có trạng thái hợp lệ và đã quá giờ kết thúc
        List<Order> unusedOrders = orderRepository.findOrdersToMarkAsUnused(
                List.of("Đặt lịch thành công", "Thay đổi lịch đặt thành công"),
                today,
                currentTime
        );

        for (Order order : unusedOrders) {
            try {
                if ("Đã thanh toán".equals(order.getPaymentStatus()) && !"Đơn cố định".equals(order.getOrderType())) {
                    order.setPaymentStatus("Đợi hoàn tiền");
                }
                order.setOrderStatus("Không sử dụng lịch đặt");
                orderRepository.save(order);
                log.info("Updated order {} to status {}", order.getId(), order.getOrderStatus());
            } catch (Exception e) {
                log.error("Failed to update order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    private void processUsedOrders(LocalDate today, LocalTime currentTime) {
        // Lấy các order đã sử dụng và quá giờ kết thúc
        List<Order> usedOrders = orderRepository.findOrdersToMarkAsCompleted(
                List.of("Đã sử dụng lịch đặt"),
                today,
                currentTime
        );

        for (Order order : usedOrders) {
            try {
                order.setOrderStatus("Đã hoàn thành");
                orderRepository.save(order);
                log.info("Updated order {} to completed status", order.getId());
            } catch (Exception e) {
                log.error("Failed to update completed order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    public OrderResponse createServiceOrder(OrderServiceRequest request) {
        // Map main order
        Order order = orderMapper.toOrderService(request);

        // Set user if provided
        if (request.getUserId() != null && !request.getUserId().isEmpty()) {
            order.setUser(userService.findById(request.getUserId()));
        }

        // Calculate total amount from services
        BigDecimal totalAmount = request.getServiceDetails().stream()
                .map(detail -> detail.getPrice().multiply(BigDecimal.valueOf(detail.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setTotalAmount(totalAmount);
        order.setPaymentAmount(request.getPaymentAmount() != null ?
                request.getPaymentAmount() : totalAmount);

        // Map and set service details
        List<ServiceDetailEntity> serviceDetails = request.getServiceDetails().stream()
                .map(orderMapper::toServiceDetailEntity)
                .peek(detail -> detail.setOrder(order))
                .collect(Collectors.toList());

        order.setServiceDetails(serviceDetails);
        BigDecimal amount = order.getTotalAmount();
        String billCode = "PM" + GenerateString.generateRandomString(13);
        // Set default values
        order.setAmountPaid(BigDecimal.ZERO);
        order.setAmountRefund(BigDecimal.ZERO);
        order.setDepositAmount(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setPaymentTimeout(LocalDateTime.now().plusMinutes(5));
        orderRepository.save(order);


        CreateQrRequest qrRequest = CreateQrRequest.builder()
                .billCode(billCode)
                .amount(amount.doubleValue())
                .signature(encrypt(amount.doubleValue(), billCode, checkSum))
                .build();

        MbQrCodeResponse qrCodeResponse;
        try {
            qrCodeResponse = paymentClient.createQr(qrRequest, apiKey, clientId);
        } catch (FeignException e) {
            throw new ApiException(e.getMessage(), "API_MB_CREATE_QR_ERROR");
        }
        log.info("send update booking status");


        TransactionRequest transaction = TransactionRequest.builder()
                .orderId(order.getId())
                .amount(amount)
                .paymentStatus(order.getPaymentStatus())
                .billCode(billCode)
                .build();

        saveTransactionToRedis(transaction);
        schedulePaymentCheck(billCode);

        OrderResponse response = orderMapperCustom.toOrderResponse(order);
        response.setQrcode(qrCodeResponse.getQrCode());
        redisTemplate.opsForValue().set(PREFIX_QR + order.getId(), qrCodeResponse.getQrCode(), 6, TimeUnit.MINUTES);
        return response;
    }


    public List<TransactionHistory> getTransactionHistory(String orderId) {
        List<Transaction> transactions = transactionService.findByOrderId(orderId);

        return transactions.stream().map(transaction -> {
            TransactionHistory history = new TransactionHistory();
            history.setPaymentStatus(transaction.getPaymentStatus());
            history.setAmount(transaction.getAmount());
            history.setCreateDate(transaction.getCreateDate());
            return history;
        }).collect(Collectors.toList());
    }

    public List<Order> findByOrderStatusInAndBookingDate(List<String> status , LocalDate date){
        return orderRepository.findByOrderStatusInAndBookingDate(status,date);
    }

    public Page<Order> getOrders(
            List<String> courtIds,
            String orderType,
            String orderStatus,
            String paymentStatus,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(page - 1, size);
        return orderRepository.findOrders(courtIds, orderType, orderStatus, paymentStatus, startDate, endDate, pageable
        );
    }

    public List<Order> searchOrdersRevenue(RevenueSummaryRequest request) {
        Specification<Order> spec = Specification.where(
                OrderSpecification.hasBookingDateBetween(
                        request.getDateRange().getStartDate(),
                        request.getDateRange().getEndDate()
                )
        ).and(OrderSpecification.hasOrderStatusIn(
                request.getFilters().getOrderStatus() != null
                        ? request.getFilters().getOrderStatus()
                        : Arrays.asList(
                        "Đặt lịch thành công",
                        "Thay đổi lịch đặt thành công",
                        "Đã hoàn thành",
                        "Đã sử dụng lịch đặt",
                        "Không sử dụng lịch đặt",
                        "Đặt dịch vụ tại sân thành công"
                )
        )).and(OrderSpecification.hasPaymentStatusIn(
                request.getFilters().getPaymentStatus()
        )).and(OrderSpecification.hasCourtIdIn(
                request.getFilters().getCourtIds()
        )).and(OrderSpecification.hasOrderTypeIn(
                request.getFilters().getOrderTypes()
        ));

        return orderRepository.findAll(spec);
    }

    public List<Order> fetchBookings(List<String> courtIds, DateRange dateRange) {
        Specification<Order> spec = Specification.where(
                OrderSpecification.hasBookingDateBetween(
                        dateRange.getStartDate(),
                        dateRange.getEndDate()
                )
        ).and(OrderSpecification.hasOrderStatusIn(Arrays.asList(
                "Đặt lịch thành công",
                "Thay đổi lịch đặt thành công",
                "Đã hoàn thành",
                "Đã sử dụng lịch đặt",
                "Không sử dụng lịch đặt"
        )));

        if (courtIds != null) {
            spec = spec.and(OrderSpecification.hasCourtIdIn(courtIds));
        }

        return orderRepository.findAll(spec);
    }

    public List<Order> findOrdersByFilters(
            List<String> courtIds,
            String orderType,
            String orderStatus,
            String paymentStatus,
            LocalDate startDate,
            LocalDate endDate
    ) {
        return orderRepository.findOrdersByFilters(
                (courtIds != null && !courtIds.isEmpty()) ? courtIds : null,
                orderType,
                orderStatus,
                paymentStatus,
                startDate,
                endDate
        );
    }

    public void checkAndSendUpcomingBookingNotifications() {
        // 1. Lấy ngày hiện tại
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 2. Tìm các đơn hàng thỏa điều kiện
        List<Order> orders = findByOrderStatusInAndBookingDate(
                Arrays.asList("Đặt lịch thành công", "Thay đổi lịch đặt thành công"),
                today
        );

        // 3. Xử lý từng đơn hàng
        if (orders != null && !orders.isEmpty()) {
            for (Order order : orders) {
                notificationService.processOrderForNotifications(order, now);
            }
        }
    }


//    private OrderResponse mapToOrderResponse(Order order, List<OrderDetail> fixedOrderDetails, List<OrderDetail> flexibleOrderDetails) {
//        return OrderResponse.builder()
//                .id(order.getId())
//                .courtName(order.getCourtName())
//                .customerName(order.getCustomerName())
//                .userId(order.getUser().getId())
//                .phoneNumber(order.getPhoneNumber())
//                .orderType(order.getOrderType())
//                .note(order.getNote())
//                .address(order.getAddress())
//                .orderStatus(order.getOrderStatus())
//                .paymentStatus(order.getPaymentStatus())
//                .totalAmount(order.getPaymentAmount())
//                .paymentAmount(order.getPaymentAmount())
//                .depositAmount(order.getDepositAmount())
//                .paymentTimeout(order.getPaymentTimeout())
//                .fixedOrderDetails(mapOrderDetails(fixedOrderDetails))
//                .flexibleOrderDetails(mapOrderDetails(flexibleOrderDetails))
//                .build();
//    }
//
//    private List<FixedResponse> mapOrderDetails(List<OrderDetail> orderDetails) {
//        return orderDetails.stream().map(orderDetail ->
//                new FixedResponse(
//                        orderDetail.getCourtSlotName(),
//                        orderDetail.getStartTime(),
//                        orderDetail.getEndTime(),
//                        orderDetail.getBookingDates().stream().map(BookingDate::getBookingDate).collect(Collectors.toList())
//                )).collect(Collectors.toList());
//    }

}

