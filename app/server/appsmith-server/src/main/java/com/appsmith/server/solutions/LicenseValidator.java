package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.LicenseValidationRequestDTO;
import com.appsmith.server.dtos.LicenseValidationResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import com.appsmith.server.services.ConfigService;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class LicenseValidator {

    private final LicenseConfig licenseConfig;
    private final CloudServicesConfig cloudServicesConfig;
    private final ConfigService configService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void check() {

        // Disable old license check and server shutdown for new usage and billing feature
        // TODO: Remove this check and completely disable shutdown when usage and billing feature is ready to ship
        Boolean licenseDbEnabled = licenseConfig.getLicenseDbEnabled();
        if (licenseDbEnabled) {
            return;
        }
        String licenseKey = licenseConfig.getLicenseKey();

        if (StringUtils.isEmpty(licenseKey)) {
            log.debug("Exiting application. Invalid license key");
            System.exit(1);
        }

        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (baseUrl == null || !org.springframework.util.StringUtils.hasText(baseUrl)) {
            throw new AppsmithException(
                    AppsmithError.INSTANCE_REGISTRATION_FAILURE, "Unable to find cloud services base URL");
        }

        Boolean isValid = configService.getInstanceId()
                .flatMap(instanceId -> WebClientUtils.create(
                                        cloudServicesConfig.getBaseUrl() + "/api/v1/license/check"
                                )
                                .post()
                                .contentType(MediaType.APPLICATION_JSON)
                                .accept(MediaType.APPLICATION_JSON)
                                .body(BodyInserters.fromValue(Map.of(
                                        "license", licenseConfig.getLicenseKey(),
                                        "instance", instanceId
                                )))
                                .retrieve()
                                .toEntity(byte[].class)
                )
                .map(responseEntity -> new String(responseEntity.getBody(), StandardCharsets.UTF_8))
                .map(body -> {
                    try {
                        JsonNode responseNode = objectMapper.readTree(body);

                        JsonNode data = responseNode.get("data");
                        if (data != null) {
                            boolean result = data.asBoolean();
                            if (result == true) {
                                return result;
                            }
                        } else {
                            // Incorrect response received from cloud services. For now, let the validity check succeed
                            // to protect the users from errors bringing down their EE instances
                            log.debug("ERROR : Invalid response structure from Cloud Services for License Check");
                            return true;
                        }
                    } catch (JsonProcessingException e) {

                    }

                    return false;

                })
                .subscribeOn(Schedulers.boundedElastic())
                .block();

        if (!isValid) {
            log.debug("Shutting down. License check returned invalid.");
            System.exit(1);
        }

        log.debug("Valid license key");
    }

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
                                    "unable to connect to cloud-services with error status {}", response.statusCode()))
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

                    if (null == license.getOrigin()) {
                        license.setOrigin(LicenseOrigin.SELF_SERVE);
                    }

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
