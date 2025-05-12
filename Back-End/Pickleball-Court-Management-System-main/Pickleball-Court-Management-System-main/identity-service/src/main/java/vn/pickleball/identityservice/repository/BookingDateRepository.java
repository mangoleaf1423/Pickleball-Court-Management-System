package vn.pickleball.identityservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.pickleball.identityservice.entity.BookingDate;
import vn.pickleball.identityservice.entity.Order;

import java.util.List;

@Repository
public interface BookingDateRepository extends JpaRepository<BookingDate, String> {
    List<BookingDate> findByOrderDetailId (String orderDetailId);

    void deleteByOrderDetailId(String orderDetailId);
}
