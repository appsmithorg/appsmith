package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.checkerframework.common.aliasing.qual.Unique;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class Tenant extends BaseDomain {

    @Unique String slug;

    String displayName;

    @Transient
    String instanceId;

    PricingPlan pricingPlan;

    TenantConfiguration tenantConfiguration;

    // TODO add SSO and other configurations here after migrating from environment variables to database configuration
}
