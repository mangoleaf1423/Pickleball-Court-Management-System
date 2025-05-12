package vn.pickleball.identityservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.pickleball.identityservice.entity.Role;
import vn.pickleball.identityservice.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor {
    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u WHERE (u.username = :value OR u.email = :value OR u.phoneNumber = :value) AND u.isActive = true")
    Optional<User> findByUsernameOrEmailOrPhoneNumber(String value);

    @Query("SELECT u FROM User u WHERE u.id = :value OR u.phoneNumber = :value")
    Optional<User> findByIdOrPhoneNumber(String value);

    Optional<User> findByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name <> :adminRole")
    List<User> findUsersWithNonAdminRole(@Param("adminRole") String adminRole);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :role")
    List<User> findUsersWithRole(@Param("role") String role);
}