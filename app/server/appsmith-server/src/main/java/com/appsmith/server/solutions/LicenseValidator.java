package com.appsmith.server.solutions;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import org.apache.commons.lang3.StringUtils;
import reactor.core.publisher.Mono;

public interface LicenseValidator {

    Mono<TenantConfiguration.License> licenseCheck(Tenant tenant);

    default Boolean isLicenseKeyValid(Tenant tenant) {
        return tenant != null
            && tenant.getTenantConfiguration() != null
            && tenant.getTenantConfiguration().getLicense() != null
            && !StringUtils.isEmpty(tenant.getTenantConfiguration().getLicense().getKey());
    }

}
