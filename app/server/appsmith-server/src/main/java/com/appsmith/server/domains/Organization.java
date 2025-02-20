package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.checkerframework.common.aliasing.qual.Unique;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;
import org.springframework.data.annotation.Transient;

import java.io.Serializable;

@Entity
@Where(clause = "deleted_at IS NULL")
@Getter
@Setter
@ToString
@NoArgsConstructor
@FieldNameConstants
public class Organization extends BaseDomain implements Serializable {

    @Unique String slug;

    String displayName;

    @Transient
    String instanceId;

    @Transient
    String adminEmailDomainHash;

    @Enumerated
    PricingPlan pricingPlan;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    OrganizationConfiguration organizationConfiguration;

    // TODO add SSO and other configurations here after migrating from environment variables to database configuration
}
