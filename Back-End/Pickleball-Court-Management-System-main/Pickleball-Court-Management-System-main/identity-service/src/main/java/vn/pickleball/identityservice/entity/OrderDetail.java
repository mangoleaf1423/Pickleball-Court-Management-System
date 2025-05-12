package vn.pickleball.identityservice.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "order_detail")
public class OrderDetail {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36)
    private String id;

    @Column(nullable = false)
    private String courtSlotId;

    @Column(nullable = false)
    private LocalTime startTime; // Thời gian bắt đầu (ví dụ: "19:30")

    @Column(nullable = false)
    private LocalTime endTime; // Thời gian kết thúc (ví dụ: "20:30")

    private BigDecimal price; // Giá (ví dụ: 180.000 đ)

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @OneToMany(mappedBy = "orderDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<BookingDate> bookingDates = new ArrayList<>();
}
