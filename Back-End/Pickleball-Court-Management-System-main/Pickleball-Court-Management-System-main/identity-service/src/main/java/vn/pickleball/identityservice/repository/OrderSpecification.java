package vn.pickleball.identityservice.repository;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import vn.pickleball.identityservice.entity.BookingDate;
import vn.pickleball.identityservice.entity.Order;
import vn.pickleball.identityservice.entity.OrderDetail;

import java.time.LocalDate;
import java.util.List;

public class OrderSpecification {

    // Lọc theo khoảng ngày booking (từ BookingDate trong OrderDetail)
    public static Specification<Order> hasBookingDateBetween(LocalDate start, LocalDate end) {
        if (start == null && end == null) return null;

        return (root, query, cb) -> {
            Subquery<Long> subquery = query.subquery(Long.class);
            Root<OrderDetail> orderDetailRoot = subquery.from(OrderDetail.class);
            Join<OrderDetail, BookingDate> bookingDateJoin = orderDetailRoot.join("bookingDates");

            Predicate datePredicate = null;
            if (start != null && end != null) {
                datePredicate = cb.between(bookingDateJoin.get("bookingDate"), start, end);
            } else if (start != null) {
                datePredicate = cb.greaterThanOrEqualTo(bookingDateJoin.get("bookingDate"), start);
            } else {
                datePredicate = cb.lessThanOrEqualTo(bookingDateJoin.get("bookingDate"), end);
            }

            subquery.select(cb.literal(1L))
                    .where(
                            cb.equal(orderDetailRoot.get("order"), root),
                            datePredicate
                    );

            return cb.exists(subquery);
        };
    }

    // Lọc theo trạng thái đơn hàng
    public static Specification<Order> hasOrderStatusIn(List<String> statuses) {
        return (root, query, cb) -> statuses != null ?
                root.get("orderStatus").in(statuses) :
                cb.conjunction();
    }

    // Lọc theo trạng thái thanh toán
    public static Specification<Order> hasPaymentStatusIn(List<String> statuses) {
        return (root, query, cb) -> statuses != null ?
                root.get("paymentStatus").in(statuses) :
                cb.conjunction();
    }

    // Lọc theo danh sách sân
    public static Specification<Order> hasCourtIdIn(List<String> courtIds) {
        return (root, query, cb) -> courtIds != null ?
                root.get("courtId").in(courtIds) :
                cb.conjunction();
    }

    // Lọc theo loại đơn hàng (ONLINE/OFFLINE)
    public static Specification<Order> hasOrderTypeIn(List<String> orderTypes) {
        return (root, query, cb) -> orderTypes != null ?
                root.get("orderType").in(orderTypes) :
                cb.conjunction();
    }
}
