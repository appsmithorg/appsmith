package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.ce.TenantServiceCE;
import reactor.core.publisher.Mono;

public interface TenantService extends TenantServiceCE {
    Mono<Tenant> findById(String id, AclPermission aclPermission);
    Mono<Tenant> save(Tenant tenant);
    Mono<Tenant> getDefaultTenant();

    Mono<Tenant> getDefaultTenant(AclPermission aclPermission);

    /**
     * To set a license key to the default tenant
     * Only valid license key will get added to the tenant
     * @param licenseKey
     * @return Mono of Tenant
     */
    Mono<Tenant> setTenantLicenseKey(String licenseKey);

    /**
     * To refresh the current license status in the DB by making a license validation request to Cloud Services and
     * return refreshed license
     * @return Mono of Tenant
     */
    Mono<Tenant> refreshAndGetCurrentLicense();

    /**
     * To check and update the status of default tenant's license
     * This can be used for periodic license checks via scheduled jobs
     * @return Mono of Tenant
     */
    Mono<Tenant> checkAndUpdateDefaultTenantLicense();

    /**
     * To check whether a tenant have valid license configuration
     * @param tenant Tenant
     * @return
     */
    Boolean isValidLicenseConfiguration(Tenant tenant);
}
