package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.checkerframework.common.aliasing.qual.Unique;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;

import static com.appsmith.external.helpers.StringUtils.dotted;

@Deprecated
// This class has been deprecated. Please use Organization instead.
@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@FieldNameConstants
public class Tenant extends BaseDomain implements Serializable {

    @Unique String slug;

    String displayName;

    @Transient
    String instanceId;

    @Transient
    String adminEmailDomainHash;

    PricingPlan pricingPlan;

    TenantConfiguration tenantConfiguration;

    // TODO add SSO and other configurations here after migrating from environment variables to database configuration

    public static class Fields {
        public static final String tenantConfiguration_isRestartRequired =
                dotted(tenantConfiguration, TenantConfiguration.Fields.isRestartRequired);
    }
}
