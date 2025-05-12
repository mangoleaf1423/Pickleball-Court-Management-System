package vn.pickleball.identityservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.pickleball.identityservice.entity.Notification;
import vn.pickleball.identityservice.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    List<Notification> findByUser_PhoneNumber(String phoneNumber);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :value OR n.phoneNumber = :value")
    List<Notification> findByUserIdOrPhoneNumber(String value);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :value OR n.phoneNumber = :value")
    Long countByIdOrPhoneNumber(String value);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.user.id = :value OR n.phoneNumber = :value) AND n.status != 'read'")
    Long countUnreadByIdOrPhoneNumber(String value);
}

