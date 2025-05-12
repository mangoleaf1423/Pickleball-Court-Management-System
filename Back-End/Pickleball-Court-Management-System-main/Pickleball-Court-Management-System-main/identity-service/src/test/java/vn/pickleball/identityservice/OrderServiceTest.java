package vn.pickleball.identityservice;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import vn.pickleball.identityservice.client.CourtClient;
import vn.pickleball.identityservice.client.PaymentClient;
import vn.pickleball.identityservice.dto.payment.CreateQrRequest;
import vn.pickleball.identityservice.dto.payment.NotificationData;
import vn.pickleball.identityservice.dto.payment.NotificationResponse;
import vn.pickleball.identityservice.dto.request.*;
import vn.pickleball.identityservice.dto.response.MbQrCodeResponse;
import vn.pickleball.identityservice.dto.response.OrderResponse;
import vn.pickleball.identityservice.entity.Order;
import vn.pickleball.identityservice.entity.OrderDetail;
import vn.pickleball.identityservice.entity.User;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.mapper.OrderMapper;
import vn.pickleball.identityservice.mapper.OrderMapperCustom;
import vn.pickleball.identityservice.mapper.TransactionMapper;
import vn.pickleball.identityservice.repository.OrderRepository;
import vn.pickleball.identityservice.service.*;
import vn.pickleball.identityservice.utils.GenerateString;


import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import vn.pickleball.identityservice.websockethandler.NotificationWebSocketHandler;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @InjectMocks
    private OrderService orderService;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TransactionService transactionService;

    @Mock
    private OrderMapper orderMapper;

    @Mock
    private PaymentClient paymentClient;

    @Mock
    private CourtClient courtClient;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ObjectMapper redisObjectMapper;

    @Mock
    private ScheduledExecutorService scheduler;

    @Mock
    private NotificationWebSocketHandler notificationWebSocketHandler;

    @Mock
    private TransactionMapper transactionMapper;

    @Mock
    private FCMService fcmService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserService userService;

    @Mock
    private EmailService emailService;

    @Mock
    private OrderDetailService orderDetailService;

    @Mock
    private BookingDateService bookingDateService;

    @Mock
    private OrderMapperCustom orderMapperCustom;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private Validator validator;

    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;

    @BeforeEach
    void setUp() {
        // Set up validator for request validation
        try {
            ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
            validator = factory.getValidator();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize validator", e);
        }

        // Mock Redis value operations
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // Mock configuration values
        try (MockedStatic<GenerateString> generateString = mockStatic(GenerateString.class)) {
            generateString.when(() -> GenerateString.generateRandomString(13)).thenReturn("1234567890123");
        }
    }

    @Test
    void createOrder_validRequest_success() throws JsonProcessingException {
        // Arrange
        OrderRequest request = createValidOrderRequest();
        Order order = new Order();
        order.setId("1");
        order.setBillCode("PM1234567890123");
        OrderResponse response = new OrderResponse();
        response.setQrcode("qrCode123");
        User user = new User();
        MbQrCodeResponse qrCodeResponse = new MbQrCodeResponse();
        qrCodeResponse.setQrCode("qrCode123");
        List<UpdateBookingSlot> bookingSlots = List.of(new UpdateBookingSlot());
        TransactionRequest transaction = TransactionRequest.builder()
                .orderId("1")
                .amount(BigDecimal.ZERO)
                .paymentStatus("Chưa đặt cọc")
                .billCode("PM1234567890123")
                .build();

        when(GenerateString.isValidSignature(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(true);
        when(orderMapper.toOrderEntity(request)).thenReturn(order);
        when(userService.findById("user1")).thenReturn(user);
        when(orderMapper.toUpdateBookingSlotList(request)).thenReturn(bookingSlots);
        when(paymentClient.createQr(any(CreateQrRequest.class), anyString(), anyString())).thenReturn(qrCodeResponse);
        when(orderRepository.save(order)).thenReturn(order);
        when(redisObjectMapper.writeValueAsString(transaction)).thenReturn("transactionJson");
        when(orderMapperCustom.toOrderResponse(order)).thenReturn(response);

        // Act
        OrderResponse result = orderService.createOrder(request);

        // Assert
        assertNotNull(result);
        assertEquals("qrCode123", result.getQrcode());
        verify(orderMapper).toOrderEntity(request);
        verify(orderRepository).save(order);
        verify(paymentClient).createQr(any(CreateQrRequest.class), anyString(), anyString());
        verify(redisTemplate.opsForValue()).set(eq("qrcode:1"), eq("qrCode123"), eq(6L), eq(TimeUnit.MINUTES));
        verify(scheduler).schedule(any(Runnable.class), eq(5L), eq(TimeUnit.MINUTES));
    }

    @Test
    void createOrder_invalidSignature_throwsException() {
        // Arrange
        OrderRequest request = createValidOrderRequest();
        when(GenerateString.isValidSignature(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(false);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> orderService.createOrder(request));
        assertEquals("AMOUNT_NOT_MATCH", exception.getErrorCode());
        assertEquals("Payment amount not match", exception.getMessage());
        verifyNoInteractions(orderMapper, orderRepository, paymentClient);
    }

    @Test
    void createOrder_invalidRequest_throwsValidationException() {
        // Arrange
        OrderRequest request = new OrderRequest();
        request.setCourtId(""); // Invalid: blank courtId
        request.setOrderDetails(List.of(createValidOrderDetailRequest()));

        // Validate
        Set<ConstraintViolation<OrderRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertEquals("Court ID is required", violations.iterator().next().getMessage());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> orderService.createOrder(request));
        assertEquals("INVALID_REQUEST", exception.getErrorCode());
        assertEquals("Court ID is required", exception.getMessage());
        verifyNoInteractions(orderMapper, orderRepository, paymentClient);
    }

    @Test
    void createOrder_invalidOrderDetail_throwsValidationException() {
        // Arrange
        OrderRequest request = createValidOrderRequest();
        OrderDetailRequest detail = new OrderDetailRequest();
        detail.setBookingDate(LocalDate.now().minusDays(1)); // Invalid: past date
        request.setOrderDetails(List.of(detail));

        // Validate
        Set<ConstraintViolation<OrderDetailRequest>> violations = validator.validate(detail);
        assertFalse(violations.isEmpty());
        assertEquals("Booking date must be today or in the future", violations.iterator().next().getMessage());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> orderService.createOrder(request));
        assertEquals("INVALID_REQUEST", exception.getErrorCode());
        assertEquals("Booking date must be today or in the future", exception.getMessage());
        verifyNoInteractions(orderMapper, orderRepository, paymentClient);
    }

    @Test
    void changeOrder_validRequest_success() throws JsonProcessingException {
        // Arrange
        String oid = "1";
        OrderRequest request = createValidOrderRequest();
        Order order = new Order();
        order.setId(oid);
        order.setOrderStatus("Đặt lịch thành công");
        order.setAmountPaid(BigDecimal.ZERO);
        order.setDepositAmount(BigDecimal.ZERO);
        OrderDetail detail = new OrderDetail();
        detail.setId("detail1");
        order.setOrderDetails(List.of(detail));
        OrderResponse response = new OrderResponse();
        response.setQrcode("qrCode123");
        List<UpdateBookingSlot> oldBooking = List.of(new UpdateBookingSlot());
        List<UpdateBookingSlot> newBooking = List.of(new UpdateBookingSlot());
        MbQrCodeResponse qrCodeResponse = new MbQrCodeResponse();
        qrCodeResponse.setQrCode("qrCode123");
        TransactionRequest transaction = TransactionRequest.builder()
                .orderId(oid)
                .amount(BigDecimal.ZERO)
                .paymentStatus("Chưa đặt cọc")
                .billCode("PM1234567890123")
                .build();

        when(GenerateString.isValidSignature(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(true);
        when(orderRepository.findById(oid)).thenReturn(Optional.of(order));
        when(orderMapper.orderToUpdateBookingSlot(order)).thenReturn(oldBooking);
        when(orderMapper.toUpdateBookingSlotList(request)).thenReturn(newBooking);
        when(paymentClient.createQr(any(CreateQrRequest.class), anyString(), anyString())).thenReturn(qrCodeResponse);
        when(orderRepository.saveAndFlush(order)).thenReturn(order);
        when(orderRepository.save(order)).thenReturn(order);
        when(redisObjectMapper.writeValueAsString(transaction)).thenReturn("transactionJson");
        when(orderMapperCustom.toOrderResponse(order)).thenReturn(response);

        // Act
        OrderResponse result = orderService.changeOrder(request, oid);

        // Assert
        assertNotNull(result);
        assertEquals("qrCode123", result.getQrcode());
        verify(orderRepository).findById(oid);
        verify(bookingDateService).deleteByOrderDetailId("detail1");
        verify(orderDetailService).deleteByOrderId(oid);
        verify(paymentClient).createQr(any(CreateQrRequest.class), anyString(), anyString());
        verify(scheduler).schedule(any(Runnable.class), eq(5L), eq(TimeUnit.MINUTES));
    }

    @Test
    void changeOrder_nonExistentOrder_throwsException() {
        // Arrange
        OrderRequest request = createValidOrderRequest();
        when(GenerateString.isValidSignature(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(true);
        when(orderRepository.findById("1")).thenReturn(Optional.empty());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> orderService.changeOrder(request, "1"));
        assertEquals("ENTITY_NOT_FOUND", exception.getErrorCode());
        assertEquals("Not found Order", exception.getMessage());
        verify(orderRepository).findById("1");
        verifyNoMoreInteractions(orderMapper, orderRepository);
    }

    @Test
    void paymentNotification_success() throws JsonProcessingException {
        // Arrange
        vn.pickleball.identityservice.dto.payment.NotificationResponse notification = new vn.pickleball.identityservice.dto.payment.NotificationResponse();
        NotificationData data = new NotificationData();
        data.setDebitAmount("100.00");
        data.setReferenceLabelCode("PM1234567890123");
        notification.setData(data);
        Order order = new Order();
        order.setId("1");
        order.setOrderType("Đơn ngày");
        order.setOrderStatus("Đặt lịch thành công");
        order.setPaymentStatus("Chưa đặt cọc");
        order.setAmountPaid(BigDecimal.ZERO);
        User user = new User();
        user.setEmail("user@example.com");
        order.setUser(user);
        TransactionRequest transactionRequest = TransactionRequest.builder()
                .orderId("1")
                .amount(BigDecimal.ZERO)
                .billCode("PM1234567890123")
                .build();
        OrderResponse orderResponse = new OrderResponse();

        when(redisObjectMapper.readValue("transactionJson", TransactionRequest.class)).thenReturn(transactionRequest);
        when(redisTemplate.opsForValue().get("transaction:PM1234567890123")).thenReturn("transactionJson");
        when(orderRepository.findById("1")).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(orderMapperCustom.toOrderResponse(order)).thenReturn(orderResponse);

        // Act
        orderService.paymentNotification(notification);

        // Assert
        verify(orderRepository).save(order);
        verify(notificationWebSocketHandler).sendNotification(any(vn.pickleball.identityservice.dto.payment.NotificationResponse.class));
        verify(transactionService).saveTransaction(any());
        verify(emailService).sendBookingConfirmationEmail(eq("user@example.com"), any());
        verify(notificationService, times(2)).sendNoti(anyString(), anyString(), eq(order));
        verify(redisTemplate).delete("transaction:PM1234567890123");
        verify(redisTemplate).delete("qrcode:1");
    }

    @Test
    void paymentNotification_nonExistentOrder_throwsException() throws JsonProcessingException {
        // Arrange
        vn.pickleball.identityservice.dto.payment.NotificationResponse notification = new vn.pickleball.identityservice.dto.payment.NotificationResponse();
        NotificationData data = new NotificationData();
        data.setDebitAmount("100.00");
        data.setReferenceLabelCode("PM1234567890123");
        notification.setData(data);
        TransactionRequest transactionRequest = TransactionRequest.builder()
                .orderId("1")
                .billCode("PM1234567890123")
                .build();

        when(redisObjectMapper.readValue("transactionJson", TransactionRequest.class)).thenReturn(transactionRequest);
        when(redisTemplate.opsForValue().get("transaction:PM1234567890123")).thenReturn("transactionJson");
        when(orderRepository.findById("1")).thenReturn(Optional.empty());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> orderService.paymentNotification(notification));
        assertEquals("ENTITY_NOT_FOUND", exception.getErrorCode());
        assertEquals("Not found Order", exception.getMessage());
        verifyNoInteractions(notificationWebSocketHandler, transactionService, emailService);
    }

    @Test
    void getOrders_success() {
        // Arrange
        String value = "1234567890";
        List<Order> orders = List.of(new Order());
        List<OrderResponse> responses = List.of(new OrderResponse());

        when(orderRepository.findByPhoneNumberOrUserId(value)).thenReturn(orders);
        when(orderMapperCustom.toOrderResponses(orders)).thenReturn(responses);

        // Act
        List<OrderResponse> result = orderService.getOrders(value);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(orderRepository).findByPhoneNumberOrUserId(value);
        verify(orderMapperCustom).toOrderResponses(orders);
    }

    @Test
    void getOrderById_success() {
        // Arrange
        String oid = "1";
        Order order = new Order();
        OrderResponse response = new OrderResponse();

        when(orderRepository.findById(oid)).thenReturn(Optional.of(order));
        when(orderMapperCustom.toOrderResponse(order)).thenReturn(response);
        when(redisTemplate.opsForValue().get("qrcode:1")).thenReturn("qrCode123");

        // Act
        OrderResponse result = orderService.getOrderById(oid);

        // Assert
        assertNotNull(result);
        assertEquals("qrCode123", result.getQrcode());
        verify(orderRepository).findById(oid);
        verify(orderMapperCustom).toOrderResponse(order);
    }

    @Test
    void getOrderById_nonExistentOrder_throwsException() {
        // Arrange
        String oid = "1";
        when(orderRepository.findById(oid)).thenReturn(Optional.empty());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> orderService.getOrderById(oid));
        assertEquals("ENTITY_NOT_FOUND", exception.getErrorCode());
        assertEquals("Not found Order", exception.getMessage());
        verify(orderRepository).findById(oid);
        verifyNoInteractions(orderMapperCustom);
    }

    @Test
    void cancelOrder_validOrder_success() {
        // Arrange
        String orderId = "1";
        Order order = new Order();
        order.setId(orderId);
        order.setOrderStatus("Đặt lịch thành công");
        order.setOrderType("Đơn ngày");
        order.setPaymentStatus("Chưa đặt cọc");
        order.setBillCode("PM1234567890123");
        OrderResponse response = new OrderResponse();
        List<UpdateBookingSlot> bookingSlots = List.of(new UpdateBookingSlot());

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderMapper.orderToUpdateBookingSlot(order)).thenReturn(bookingSlots);
        when(orderRepository.save(order)).thenReturn(order);
        when(orderMapperCustom.toOrderResponse(order)).thenReturn(response);

        // Act
        OrderResponse result = orderService.cancelOrder(orderId);

        // Assert
        assertNotNull(result);
        verify(orderRepository).save(order);
        verify(courtClient).updateBookingSlot(any(UpdateBookingSlot.class));
//        verify(notificationService, times(2)).sendNoti(anyString(), anyString(), eq(order));
        verify(redisTemplate).delete("transaction:PM1234567890123");
    }

    @Test
    void cancelOrder_usedOrder_throwsException() {
        // Arrange
        String orderId = "1";
        Order order = new Order();
        order.setOrderStatus("Đã sử dụng lịch đặt");

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> orderService.cancelOrder(orderId));
        assertEquals("ORDER_INVALID", exception.getErrorCode());
        assertEquals("Không thể hủy lịch vì đã sử dụng dịch vụ", exception.getMessage());
        verify(orderRepository).findById(orderId);
        verifyNoInteractions(orderMapper, orderRepository);
    }

//    @Test
//    void processPaymentTimeout_orderCancelled_success() throws JsonProcessingException {
//        // Arrange
//        String billCode = "PM1234567890123";
//        Order order = new Order();
//        order.setId("1");
//        order.setOrderStatus("Đặt lịch thành công");
//        order.setOrderType("Đơn ngày");
//        TransactionRequest transactionRequest = TransactionRequest.builder()
//                .orderId("1")
//                .billCode(billCode)
//                .build();
//        List<UpdateBookingSlot> bookingSlots = List.of(new UpdateBookingSlot());
//
//        when(redisTemplate.hasKey("transaction:PM1234567890123")).thenReturn(true);
//        when(redisTemplate.opsForValue().get("transaction:PM1234567890123")).thenReturn("transactionJson");
//        when(redisObjectMapper.readValue("transactionJson", TransactionRequest.class)).thenReturn(transactionRequest);
//        when(orderRepository.findById("1")).thenReturn(Optional.of(order));
//        when(orderRepository.save(order)).thenReturn(order);
//        when(redisObjectMapper.readValue(eq("bookingJson"), any(TypeFactory.class))).thenReturn(bookingSlots);
//        when(redisTemplate.opsForValue().get("bookingslot:PM1234567890123")).thenReturn("bookingJson");
//
//        // Act
//        orderService.processPaymentTimeout(billCode);
//
//        // Assert
//        verify(orderRepository).save(order);
//        verify(notificationWebSocketHandler).sendNotification(any(NotificationResponse.class));
//        verify(notificationService).sendNoti(eq("HỦY ĐẶT LỊCH DO QUÁ GIỜ THANH TOÁN"), anyString(), eq(order));
//        verify(courtClient).updateBookingSlot(any(UpdateBookingSlot.class));
//    }

    private OrderRequest createValidOrderRequest() {
        OrderRequest request = new OrderRequest();
        request.setCourtId("court1");
        request.setUserId("user1");
        request.setCustomerName("John Doe");
        request.setPhoneNumber("0123456789");
        request.setNote("Test order");
        request.setOrderType("Đơn ngày");
        request.setDiscountCode("DISC10");
        request.setTotalAmount(new BigDecimal("1000.00"));
        request.setDiscountAmount(BigDecimal.ZERO);
        request.setPaymentAmount(new BigDecimal("1000.00"));
        request.setAmountPaid(BigDecimal.ZERO);
        request.setDepositAmount(new BigDecimal("200.00"));
        request.setPaymentStatus("Chưa đặt cọc");
        request.setSignature("validSignature");
        request.setOrderDetails(List.of(createValidOrderDetailRequest()));
        return request;
    }

    private OrderDetailRequest createValidOrderDetailRequest() {
        OrderDetailRequest detail = new OrderDetailRequest();
        detail.setBookingDate(LocalDate.now());
        detail.setBookingSlots(List.of(createValidOrderDetailDto()));
        return detail;
    }

    private OrderDetailDto createValidOrderDetailDto() {
        return new OrderDetailDto(
                "slot1",
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                new BigDecimal("100.00")
        );
    }
}