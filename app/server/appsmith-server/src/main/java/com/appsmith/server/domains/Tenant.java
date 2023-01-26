package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.appsmith.server.constants.ConfigNames;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.checkerframework.common.aliasing.qual.Unique;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Tenant extends BaseDomain {

    @Unique
    @JsonView(Views.Public.class)
    String slug;

    @JsonView(Views.Public.class)
    String displayName;

    @JsonView(Views.Public.class)
    PricingPlan pricingPlan;

    @JsonView(Views.Public.class)
    TenantConfiguration tenantConfiguration;

    // TODO add SSO and other configurations here after migrating from environment variables to database configuration
}
