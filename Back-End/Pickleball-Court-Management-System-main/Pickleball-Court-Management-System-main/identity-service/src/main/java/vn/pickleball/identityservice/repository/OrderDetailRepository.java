package vn.pickleball.identityservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.pickleball.identityservice.entity.Order;
import vn.pickleball.identityservice.entity.OrderDetail;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, String> {

    @Modifying
    @Query("DELETE FROM OrderDetail od WHERE od.order = :order")
    void deleteByOrder(@Param("order") Order order);

    void deleteByOrderId(String orderId);
}
