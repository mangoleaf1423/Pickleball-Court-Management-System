package vn.pickleball.identityservice.entity;


import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;


@Data
@MappedSuperclass
@EqualsAndHashCode(callSuper = false)
@FilterDef(name =  BaseEntity.Config.FILTER_NAME,
        parameters = @ParamDef(name = BaseEntity.Config.FILTER_PARAMETER_NAME, type = Boolean.class),
        defaultCondition = BaseEntity.Config.FILTER_COLUMN_NAME + " = :" + BaseEntity.Config.FILTER_PARAMETER_NAME)
@Filter(name =  BaseEntity.Config.FILTER_NAME)
public class BaseEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_modified_at")
    private LocalDateTime lastModifiedAt;

    @Column(name = "is_deleted", columnDefinition = "boolean default false")
    private Boolean isDeleted = false;

    public interface Config {
        String FILTER_NAME = "baseFilter";
        String FILTER_PARAMETER_NAME = "isDeleted";
        String FILTER_PARAMETER_TYPE = "boolean";
        String FILTER_COLUMN_NAME = "is_deleted";
    }
    @PrePersist
    protected void onCreate() {
        if(createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        lastModifiedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastModifiedAt = LocalDateTime.now();
    }
}

