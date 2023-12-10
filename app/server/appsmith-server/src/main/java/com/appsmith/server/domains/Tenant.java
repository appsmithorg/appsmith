package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class Tenant extends BaseDomain {

    @Column(unique = true)
    String slug;

    String displayName;

    @Transient
    String instanceId;

    PricingPlan pricingPlan;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    TenantConfiguration tenantConfiguration;

    // TODO add SSO and other configurations here after migrating from environment variables to database configuration
}
