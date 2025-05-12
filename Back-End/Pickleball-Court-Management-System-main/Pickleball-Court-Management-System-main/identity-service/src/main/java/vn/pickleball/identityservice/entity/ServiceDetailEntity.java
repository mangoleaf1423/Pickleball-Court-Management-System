package vn.pickleball.identityservice.entity;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "order_service_detail")
public class ServiceDetailEntity {
    @Id
    @UuidGenerator
    @Column(name = "id", length = 36)
    private String id;

    @Column(nullable = false)
    private String courtServiceId;

    @Column(nullable = false)
    private int quantity;

    private BigDecimal price; // Giá (ví dụ: 180.000 đ)

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
}
