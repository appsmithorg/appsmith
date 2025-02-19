package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.checkerframework.common.aliasing.qual.Unique;
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

    PricingPlan pricingPlan;

    OrganizationConfiguration organizationConfiguration;

    // TODO add SSO and other configurations here after migrating from environment variables to database configuration
}
