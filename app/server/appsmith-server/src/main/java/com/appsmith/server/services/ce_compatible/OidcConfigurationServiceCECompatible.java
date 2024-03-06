package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;

public interface OidcConfigurationServiceCECompatible {

    TenantConfiguration getTenantConfiguration(TenantConfiguration tenantConfiguration);
}
