package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@FieldNameConstants
public class Tenant extends BaseDomain {

    @Indexed(Unique= true)
    String slug;

    String displayName;

    @Transient
    String instanceId;

    PricingPlan pricingPlan;

    TenantConfiguration tenantConfiguration;

    // TODO add SSO and other configurations here after migrating from environment variables to database configuration
}
