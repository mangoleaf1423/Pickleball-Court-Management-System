package vn.pickleball.identityservice.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "booking_date")
public class BookingDate {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36)
    private String id;

    @Column(nullable = false)
    private LocalDate bookingDate; // Ngày đặt sân

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "order_detail_id", nullable = false)
    private OrderDetail orderDetail;
}

