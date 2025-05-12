package vn.pickleball.identityservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.pickleball.identityservice.entity.Order;
import vn.pickleball.identityservice.entity.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> , JpaSpecificationExecutor {

    List<Order> findByPhoneNumber(String phoneNumber);

    @Query("SELECT n FROM Order n WHERE n.user.id = :value OR n.phoneNumber = :value ORDER BY n.createdAt DESC")
    List<Order> findByPhoneNumberOrUserId(String value);

//    List<Order> findByBookingDateAndCourtId(LocalDate bookingDate, String courtId);

//    List<Order> findByOrderStatusInAndCourtIdAndBookingDate(
//            List<String> orderStatuses, String courtId, LocalDate bookingDate
//    );

    @Query("SELECT DISTINCT o FROM Order o " +
            "JOIN o.orderDetails od " +
            "JOIN od.bookingDates bd " +
            "WHERE o.courtId = :courtId " +
            "AND o.orderStatus IN :orderStatuses " +
            "AND bd.bookingDate = :bookingDate")
    List<Order> findByOrderStatusInAndCourtIdAndBookingDate(
            @Param("orderStatuses") List<String> orderStatuses,
            @Param("courtId") String courtId,
            @Param("bookingDate") LocalDate bookingDate
    );

//    List<Order> findByOrderStatusNotAndPaymentStatusAndSettlementTimeLessThanEqual(
//            String orderStatus, String paymentStatus, LocalDateTime settlementTime
//    );

    List<Order> findByPaymentStatus(String status);

    @Query("SELECT DISTINCT o FROM Order o " +
            "JOIN o.orderDetails od " +
            "JOIN od.bookingDates bd " +
            "WHERE (:courtIds IS NULL OR o.courtId IN :courtIds) " +
            "AND (:orderType IS NULL OR o.orderType = :orderType) " +
            "AND (:orderStatus IS NULL OR o.orderStatus = :orderStatus) " +
            "AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus) " +
            "AND (:startDate IS NULL OR bd.bookingDate >= :startDate) " +
            "AND (:endDate IS NULL OR bd.bookingDate <= :endDate) " +
            "ORDER BY o.createdAt DESC")
    Page<Order> findOrders(
            @Param("courtIds") List<String> courtIds,
            @Param("orderType") String orderType,
            @Param("orderStatus") String orderStatus,
            @Param("paymentStatus") String paymentStatus,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    @Query("SELECT DISTINCT o FROM Order o " +
            "JOIN o.orderDetails od " +
            "JOIN od.bookingDates bd " +
            "WHERE (:courtIds IS NULL OR o.courtId IN :courtIds) " +
            "AND (:orderType IS NULL OR o.orderType = :orderType) " +
            "AND (:orderStatus IS NULL OR o.orderStatus = :orderStatus) " +
            "AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus) " +
            "AND (:startDate IS NULL OR bd.bookingDate >= :startDate) " +
            "AND (:endDate IS NULL OR bd.bookingDate <= :endDate)")
    List<Order> findOrdersByFilters(
            @Param("courtIds") List<String> courtIds,
            @Param("orderType") String orderType,
            @Param("orderStatus") String orderStatus,
            @Param("paymentStatus") String paymentStatus,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);



    @Query("SELECT od.courtSlotId, bd.bookingDate FROM OrderDetail od " +
            "JOIN od.bookingDates bd " +
            "JOIN od.order o " +
            "WHERE o.courtId = :courtId " +
            "AND o.orderStatus IN :orderStatuses " +
            "AND bd.bookingDate IN :bookingDates " +
            "AND (od.startTime < :endTime AND od.endTime > :startTime)")
    List<Object[]> findBookedCourtSlots(@Param("courtId") String courtId,
                                        @Param("bookingDates") List<LocalDate> bookingDates,
                                        @Param("startTime") LocalTime startTime,
                                        @Param("endTime") LocalTime endTime,
                                        @Param("orderStatuses") List<String> orderStatuses);

    @Query("SELECT DISTINCT o FROM Order o " +
            "JOIN o.orderDetails od " +
            "JOIN od.bookingDates bd " +
            "WHERE o.orderStatus IN :statuses " +
            "AND o.orderType <> 'Đơn cố định' " +
            "AND bd.bookingDate = :bookingDate")
    List<Order> findByOrderStatusInAndBookingDate(
            @Param("statuses") List<String> statuses,
            @Param("bookingDate") LocalDate bookingDate);


    @Query("SELECT DISTINCT o FROM Order o " +
            "JOIN o.orderDetails od " +
            "JOIN od.bookingDates bd " +
            "WHERE bd.bookingDate = :bookingDate " +
            "AND (:courtIds IS NULL OR o.courtId IN :courtIds) " +
            "AND o.orderStatus IN :statuses " +
            "AND o.orderType <> 'Đơn cố định' " +
            "AND (:startTime IS NULL OR od.startTime >= :startTime) " +
            "AND (:endTime IS NULL OR od.endTime <= :endTime) " +
            "AND (:phoneNumber IS NULL OR o.phoneNumber = :phoneNumber) " +
            "AND (:customerName IS NULL OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :customerName, '%'))) " +
            "ORDER BY o.createdAt DESC")
    Page<Order> findOrdersWithFiltersByStaff(
            @Param("bookingDate") LocalDate bookingDate,
            @Param("courtIds") List<String> courtIds,
            @Param("statuses") List<String> statuses,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("phoneNumber") String phoneNumber,
            @Param("customerName") String customerName,
            Pageable pageable);



    @Query("SELECT o FROM Order o WHERE o.id = :orderId AND o.orderStatus IN :orderStatuses AND o.paymentStatus = :paymentStatuses")
    Optional<Order> findByIdAndStatuses(
            @Param("orderId") String orderId,
            @Param("orderStatuses") List<String> orderStatuses,
            @Param("paymentStatuses") String paymentStatuses);

    @Query("SELECT DISTINCT o FROM Order o " +
            "JOIN o.orderDetails od " +
            "JOIN od.bookingDates bd " +
            "WHERE o.orderStatus IN :statuses " +
            "AND bd.bookingDate = :today " +
            "AND od.endTime < :currentTime")
    List<Order> findOrdersToMarkAsUnused(
            @Param("statuses") List<String> statuses,
            @Param("today") LocalDate today,
            @Param("currentTime") LocalTime currentTime);

    @Query("SELECT DISTINCT o FROM Order o " +
            "JOIN o.orderDetails od " +
            "JOIN od.bookingDates bd " +
            "WHERE o.orderStatus IN :statuses " +
            "AND bd.bookingDate = :today " +
            "AND od.endTime < :currentTime")
    List<Order> findOrdersToMarkAsCompleted(
            @Param("statuses") List<String> statuses,
            @Param("today") LocalDate today,
            @Param("currentTime") LocalTime currentTime);
}
