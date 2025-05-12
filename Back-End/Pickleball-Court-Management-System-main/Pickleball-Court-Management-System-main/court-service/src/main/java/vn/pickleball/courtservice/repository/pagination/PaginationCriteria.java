package vn.pickleball.courtservice.repository.pagination;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.pickleball.courtservice.entity.Court;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class PaginationCriteria {

    @PersistenceContext
    private EntityManager entityManager;

    private static final String LIKE_FORMAT = "%%%s%%";

    public List<Court> getCourts(int offset, int pageSize, String search) {
        CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();
        CriteriaQuery<Court> query = criteriaBuilder.createQuery(Court.class);
        Root<Court> root = query.from(Court.class);

        List<Predicate> predicates = buildPredicates(criteriaBuilder, root, search);
        query.where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(query)
                .setFirstResult(offset)
                .setMaxResults(pageSize)
                .getResultList();
    }

    public Long getTotalCourts(String search) {
        CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = criteriaBuilder.createQuery(Long.class);
        Root<Court> root = query.from(Court.class);

        List<Predicate> predicates = buildPredicates(criteriaBuilder, root, search);
        query.select(criteriaBuilder.count(root)).where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(query).getSingleResult();
    }

    private List<Predicate> buildPredicates(CriteriaBuilder criteriaBuilder, Root<Court> root, String search) {
        List<Predicate> predicates = new ArrayList<>();

        predicates.add(criteriaBuilder.isTrue(root.get("isActive")));


        if (!search.isEmpty()) {
            predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(root.get("name"), String.format(LIKE_FORMAT, search)),
                    criteriaBuilder.like(root.get("address"), String.format(LIKE_FORMAT, search))
            ));
        }


        return predicates;
    }
}
