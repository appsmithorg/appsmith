package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
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
                .flatMap(instanceId -> WebClient.create(
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
}
