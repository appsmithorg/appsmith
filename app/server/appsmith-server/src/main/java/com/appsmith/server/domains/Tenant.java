package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;

import java.io.Serial;
import java.io.Serializable;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
@Where(clause = "deleted_at IS NULL")
@FieldNameConstants
public class Tenant extends BaseDomain implements Serializable {

    // When changing tenant object, update the serialization version number to ensure that in a multi pod
    // deployment, new pods only read the new tenant object and not the old one from redis cache.
    @Serial
    private static final long serialVersionUID = 1459916000401322518L;

    @Column(unique = true)
    String slug;

    String displayName;

    @Transient
    String instanceId;

    @Transient
    String adminEmailDomainHash;

    @Enumerated(EnumType.STRING)
    PricingPlan pricingPlan;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    TenantConfiguration tenantConfiguration;

    // TODO add SSO and other configurations here after migrating from environment variables to database configuration

    public static final class Fields extends BaseDomain.Fields {}
}
