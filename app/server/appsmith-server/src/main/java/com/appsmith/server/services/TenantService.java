package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.UpdateLicenseKeyDTO;
import com.appsmith.server.services.ce.TenantServiceCE;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public interface TenantService extends TenantServiceCE {
    Mono<Tenant> findById(String id, AclPermission aclPermission);

    Mono<Tenant> save(Tenant tenant);

    Mono<Tenant> getDefaultTenant(AclPermission aclPermission);

    /**
     * To add a license key to the default tenant and return redirect URL
     * @param licenseKey License key
     * @param exchange ServerWebExchange
     * @return Mono of String
     */
    Mono<String> addLicenseKeyAndGetRedirectUrl(String licenseKey, ServerWebExchange exchange);

    Mono<Tenant> removeLicenseKey();

    Mono<Tenant> syncLicensePlans();

    /**
     * To update the default tenant's license key
     * Response will be status of update with 2xx
     * @param licenseKey License key received from client
     * @return Mono of Tenant
     */
    Mono<Tenant> updateTenantLicenseKey(UpdateLicenseKeyDTO licenseKey);

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
     * @return Boolean
     */
    Boolean isValidLicenseConfiguration(Tenant tenant);

    Mono<Boolean> isEnterprisePlan(String tenantId);

    Mono<License> getTenantLicense(String tenantId);

    /**
     * The method takes 3 inputs, a Mono of tenantConfiguration as JSON String, Part file for brand logo and Part file for brand favicon.
     * None of the above inputs are compulsory, i.e., Mono.empty() is a valid input to any of the parameters.
     *
     * @implNote If the JSON String of tenantConfiguration is not correct, it will throw a BAD_REQUEST exception. If the size of file provided for Brand Logo or Brand Favicon is more than 1024KB, it will throw a PAYLOAD_TOO_LARGE exception.
     * @return Default tenant with updates if any.
     */
    Mono<Tenant> updateDefaultTenantConfiguration(
            Mono<String> tenantConfigAsStringMono, Mono<Part> brandLogoMono, Mono<Part> brandFaviconMono);
}
