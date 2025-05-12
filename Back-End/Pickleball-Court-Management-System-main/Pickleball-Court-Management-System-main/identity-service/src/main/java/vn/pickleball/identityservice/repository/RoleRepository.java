package vn.pickleball.identityservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.pickleball.identityservice.entity.Role;

import java.util.List;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {

    @Query("SELECT r FROM Role r WHERE r.name <> :adminRole")
    List<Role> findRolesWithoutAdmin(@Param("adminRole") String adminRole);

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END
        FROM User u
        JOIN u.roles r
        WHERE r.name = :roleName
    """)
    boolean existsUserWithRoleName(@Param("roleName") String roleName);
}
