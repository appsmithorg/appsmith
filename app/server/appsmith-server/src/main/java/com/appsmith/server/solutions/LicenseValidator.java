package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.LicenseValidationRequestDTO;
import com.appsmith.server.dtos.LicenseValidationResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;
import com.appsmith.server.services.ConfigService;

@Component
@RequiredArgsConstructor
@Slf4j
public class LicenseValidator {
    private final CloudServicesConfig cloudServicesConfig;
    private final ConfigService configService;
    private final ReleaseNotesService releaseNotesService;


    /**
     * To check the license of a tenant with Cloud Services
     * @param tenant
     * @return License
     */
    public Mono<TenantConfiguration.License> licenseCheck(Tenant tenant) {
        log.debug("Initiating License Check");
        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (StringUtils.isEmpty(baseUrl)) {
            log.debug("Unable to find cloud services base URL. Shutting down.");
            // Shutting dwn server as we can't check the license validity without cloud-server
            // TODO implementation may change after we start supporting air gap environments
            System.exit(1);
        }

        TenantConfiguration.License license = isLicenseKeyValid(tenant)
            ? tenant.getTenantConfiguration().getLicense()
            : new TenantConfiguration.License();

        if (StringUtils.isEmpty(license.getKey())) {
            log.debug("License key not found for tenant {}", tenant.getId());
            return Mono.just(license);
        }

        LicenseValidationRequestDTO requestDTO = new LicenseValidationRequestDTO();
        requestDTO.setLicenseKey(license.getKey());
        requestDTO.setTenantId(tenant.getId());
        requestDTO.setAppsmithVersion(releaseNotesService.getRunningVersion());

        return configService.getInstanceId()
                .flatMap(instanceId -> {
                    requestDTO.setInstanceId(instanceId);
                        return WebClientUtils.create(
                                cloudServicesConfig.getBaseUrl() + "/api/v1/license/validate"
                            )
                            .post()
                            .contentType(MediaType.APPLICATION_JSON)
                            .accept(MediaType.APPLICATION_JSON)
                            .body(BodyInserters.fromValue(requestDTO))
                            .retrieve()
                            .onStatus(
                                HttpStatusCode::isError,
                                response -> Mono.error(new AppsmithException(
                                    AppsmithError.CLOUD_SERVICES_ERROR,
                                    "unable to connect to cloud-services with error status ", response.statusCode()))
                            )
                            .bodyToMono(new ParameterizedTypeReference<ResponseDTO<LicenseValidationResponseDTO>>(){});
                    }
                )
                .map(ResponseDTO::getData)
                .map(licenseValidationResponse -> {
                    log.debug("License validation completed for tenant {}", tenant.getId());
                    license.setActive(licenseValidationResponse.isValid());
                    license.setExpiry(licenseValidationResponse.getExpiry());
                    license.setType(licenseValidationResponse.getLicenseType());
                    license.setStatus(licenseValidationResponse.getLicenseStatus());
                    license.setOrigin(licenseValidationResponse.getOrigin());
                    return license;
                });
    }

    private Boolean isLicenseKeyValid(Tenant tenant) {
        return tenant != null
            && tenant.getTenantConfiguration() != null
            && tenant.getTenantConfiguration().getLicense() != null
            && !StringUtils.isEmpty(tenant.getTenantConfiguration().getLicense().getKey());
    }
}
