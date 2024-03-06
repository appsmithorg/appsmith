package com.appsmith.server.solutions;

import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.LicenseValidationRequestDTO;
import com.appsmith.server.dtos.TenantDowngradeRequestDTO;
import org.apache.commons.lang3.StringUtils;
import reactor.core.publisher.Mono;

public interface LicenseAPIManager {

    Mono<License> licenseCheck(Tenant tenant);

    default Mono<Boolean> downgradeTenantToFreePlan(Tenant tenant) {
        return Mono.just(true);
    }

    default Boolean isLicenseKeyValid(Tenant tenant) {
        return tenant != null
                && tenant.getTenantConfiguration() != null
                && tenant.getTenantConfiguration().getLicense() != null
                && !StringUtils.isEmpty(
                        tenant.getTenantConfiguration().getLicense().getKey());
    }

    Mono<LicenseValidationRequestDTO> populateLicenseValidationRequest(Tenant tenant);

    Mono<TenantDowngradeRequestDTO> populateTenantDowngradeRequest(Tenant tenant);
}
