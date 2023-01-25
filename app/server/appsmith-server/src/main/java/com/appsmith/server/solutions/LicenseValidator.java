package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import com.appsmith.server.services.ConfigService;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static com.appsmith.server.domains.TenantConfiguration.License.LicenseType.PAID;

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
            System.exit(1);
        }
        if (!isLicenseKeyValid(tenant)) {
            log.debug("No License Key Present");
            return Mono.just(new TenantConfiguration.License());
        }
        TenantConfiguration.License license = tenant.getTenantConfiguration().getLicense();
        license.setActive(true);
        license.setType(PAID);
        license.setExpiry(Instant.now().plus(30, ChronoUnit.DAYS));
        return configService.getInstanceId()
                .flatMap(instanceId -> WebClientUtils.create(
                                        cloudServicesConfig.getBaseUrl() + "/api/v1/license/check"
                                )
                                .post()
                                .contentType(MediaType.APPLICATION_JSON)
                                .accept(MediaType.APPLICATION_JSON)
                                .body(BodyInserters.fromValue(Map.of(
                                        "license", license.getKey(),
                                        "tenant", tenant.getId(),
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
                            // TODO: update response data according the actual response from CS once new API is ready
                            if (result == false) {
                                license.setActive(false);
                                license.setExpiry(null);
                                license.setType(null);
                            }
                        } else {
                            // Incorrect response received from cloud services. For now, let the validity check succeed
                            // to protect the users from errors bringing down their EE instances
                            log.debug("ERROR : Invalid response structure from Cloud Services for License Check");
                        }
                    } catch (JsonProcessingException e) {
                        // Incorrect response received from cloud services. For now, let the validity check succeed
                        // to protect the users from errors bringing down their EE instances
                        log.debug("ERROR : JSON Processing Exception - Invalid response structure from Cloud Services for License Check");
                    }
                    log.debug("Completed License Check");
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
