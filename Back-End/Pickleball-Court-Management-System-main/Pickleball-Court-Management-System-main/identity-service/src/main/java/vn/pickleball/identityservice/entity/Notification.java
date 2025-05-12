package vn.pickleball.identityservice.entity;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36)
    private String id;

    private String title;

    private String description;

    private String status;

    private LocalDateTime createAt;

    @Column(columnDefinition = "TEXT")
    private String notificationData;

    private String phoneNumber;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User user;
}
