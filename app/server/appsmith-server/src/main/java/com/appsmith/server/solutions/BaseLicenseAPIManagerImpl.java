package com.appsmith.server.solutions;

import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.LicenseValidationRequestDTO;
import com.appsmith.server.dtos.TenantDowngradeRequestDTO;
import com.appsmith.server.services.ConfigService;
import lombok.AllArgsConstructor;
import reactor.core.publisher.Mono;

@AllArgsConstructor
public abstract class BaseLicenseAPIManagerImpl implements LicenseAPIManager {

    private final ReleaseNotesService releaseNotesService;

    private final ConfigService configService;

    @Override
    public Mono<LicenseValidationRequestDTO> populateLicenseValidationRequest(Tenant tenant) {
        Mono<String> instanceIdMono = configService.getInstanceId();

        License license = Boolean.TRUE.equals(isLicenseKeyValid(tenant))
                ? tenant.getTenantConfiguration().getLicense()
                : new License();

        LicenseValidationRequestDTO requestDTO = new LicenseValidationRequestDTO();
        requestDTO.setLicenseKey(license.getKey());
        requestDTO.setTenantId(tenant.getId());
        requestDTO.setAppsmithVersion(releaseNotesService.getRunningVersion());

        return instanceIdMono.map(instanceId -> {
            requestDTO.setInstanceId(instanceId);
            return requestDTO;
        });
    }

    @Override
    public Mono<TenantDowngradeRequestDTO> populateTenantDowngradeRequest(Tenant tenant) {
        TenantDowngradeRequestDTO requestDTO = new TenantDowngradeRequestDTO();
        if (tenant.getTenantConfiguration() == null
                || tenant.getTenantConfiguration().getLicense() == null) {
            return Mono.just(new TenantDowngradeRequestDTO());
        }
        License license = tenant.getTenantConfiguration().getLicense();
        requestDTO.setTenantId(tenant.getId());
        requestDTO.setFromLicensePlan(license.getPreviousPlan());
        requestDTO.setToLicensePlan(license.getPlan());
        requestDTO.setAppsmithInstanceId(tenant.getInstanceId());
        return configService.getInstanceId().map(instanceId -> {
            requestDTO.setAppsmithInstanceId(instanceId);
            return requestDTO;
        });
    }
}
