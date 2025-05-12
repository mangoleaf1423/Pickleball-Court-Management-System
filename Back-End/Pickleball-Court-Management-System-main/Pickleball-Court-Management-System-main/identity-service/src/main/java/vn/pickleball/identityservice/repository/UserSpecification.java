package vn.pickleball.identityservice.repository;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import vn.pickleball.identityservice.entity.CourtStaff;
import vn.pickleball.identityservice.entity.Role;
import vn.pickleball.identityservice.entity.User;

import java.util.List;

public class UserSpecification {
    public static Specification<User> filterUsersExcludeAdmin(String username, String phoneNumber, String email, String roleName, String courtId) {
        return (root, query, cb) -> {
            query.distinct(true);
            Predicate predicate = cb.conjunction();

            if (username != null && !username.isBlank()) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%"));
            }

            if (phoneNumber != null && !phoneNumber.isBlank()) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("phoneNumber")), "%" + phoneNumber.toLowerCase() + "%"));
            }

            if (email != null && !email.isBlank()) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%"));
            }

            if (courtId != null && !courtId.isBlank()) {
                Join<User, CourtStaff> courtStaffJoin = root.join("courtStaffs", JoinType.INNER);
                predicate = cb.and(predicate, cb.like(cb.lower(courtStaffJoin.get("courtId")), "%" + courtId.toLowerCase() + "%"));
            }

            if (roleName != null && !roleName.isBlank()) {
                Join<User, Role> rolesJoin = root.join("roles", JoinType.INNER);
                predicate = cb.and(predicate, cb.like(cb.lower(rolesJoin.get("name")), "%" + roleName.toLowerCase() + "%"));
            }

            // Loại trừ role ADMIN, nhưng không áp dụng nếu roleName là ADMIN
            if (roleName == null || !roleName.equalsIgnoreCase("ADMIN")) {
                Subquery<String> subquery = query.subquery(String.class);
                Root<User> subRoot = subquery.from(User.class);
                Join<User, Role> subJoinRole = subRoot.join("roles", JoinType.INNER);
                subquery.select(subRoot.get("id"))
                        .where(cb.equal(subJoinRole.get("name"), "ADMIN"));
                predicate = cb.and(predicate, cb.not(root.get("id").in(subquery)));
            }

            return predicate;
        };
    }

    public static Specification<User> filterUsersExcludeManager(String username, String phoneNumber, String email, String roleName, List<String> courtIds) {
        return (root, query, cb) -> {
            query.distinct(true);
            Predicate predicate = cb.conjunction();

            if (username != null && !username.isBlank()) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%"));
            }

            if (phoneNumber != null && !phoneNumber.isBlank()) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("phoneNumber")), "%" + phoneNumber.toLowerCase() + "%"));
            }

            if (email != null && !email.isBlank()) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%"));
            }

            if (courtIds != null && !courtIds.isEmpty()) {
                Join<User, CourtStaff> courtStaffJoin = root.join("courtStaffs", JoinType.INNER);
                predicate = cb.and(predicate, courtStaffJoin.get("courtId").in(courtIds));
            }

            if (roleName != null && !roleName.isBlank()) {
                Join<User, Role> rolesJoin = root.join("roles", JoinType.INNER);
                predicate = cb.and(predicate, cb.like(cb.lower(rolesJoin.get("name")), "%" + roleName.toLowerCase() + "%"));
            }

            // Loại trừ role ADMIN và MANAGER, nhưng không áp dụng nếu roleName là ADMIN hoặc MANAGER
            if (roleName == null || (!roleName.equalsIgnoreCase("ADMIN") && !roleName.equalsIgnoreCase("MANAGER"))) {
                Subquery<String> subquery = query.subquery(String.class);
                Root<User> subRoot = subquery.from(User.class);
                Join<User, Role> subJoinRole = subRoot.join("roles", JoinType.INNER);
                subquery.select(subRoot.get("id"))
                        .where(subJoinRole.get("name").in("ADMIN", "MANAGER"));
                predicate = cb.and(predicate, cb.not(root.get("id").in(subquery)));
            }

            return predicate;
        };
    }
}

