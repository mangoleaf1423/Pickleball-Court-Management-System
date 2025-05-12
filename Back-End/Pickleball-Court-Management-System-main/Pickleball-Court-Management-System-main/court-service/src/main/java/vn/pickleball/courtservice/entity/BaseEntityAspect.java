package vn.pickleball.courtservice.entity;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.hibernate.Session;
import org.springframework.stereotype.Component;



@Aspect
@Component
@RequiredArgsConstructor
public class BaseEntityAspect {
    private final EntityManager entityManager;

    @Before("beforeExecuteMethodInRepository()")
    public void beforeQuery(JoinPoint joinPoint) {
        entityManager.unwrap(Session.class)
                .enableFilter(BaseEntity.Config.FILTER_NAME)
                .setParameter(BaseEntity.Config.FILTER_PARAMETER_NAME, false);
    }

    /**
     * Pointcut on any method inside package *.repository
     */
    @Pointcut("execution(* vn..repository..*(..))")
    private void beforeExecuteMethodInRepository() {}
}

