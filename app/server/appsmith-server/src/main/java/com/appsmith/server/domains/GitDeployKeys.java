package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Where(clause = "deleted_at IS NULL")
@FieldNameConstants
public class GitDeployKeys extends BaseDomain {
    String email;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    GitAuth gitAuth;
}
