package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.UsagePulseReportDTO;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;
import com.appsmith.server.services.ConfigService;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class UsageReporter {

    private final CloudServicesConfig cloudServicesConfig;
    private final ConfigService configService;
    private final ObjectMapper objectMapper;


    /**
     * To report usage data to Cloud Services
     * @param usagePulseReportDTO
     * @return
     */
    public Mono<Boolean> reportUsage(UsagePulseReportDTO usagePulseReportDTO) {
        log.debug("Reporting usage to Cloud Services");
        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (baseUrl == null || !org.springframework.util.StringUtils.hasText(baseUrl)) {
            log.debug("Unable to find cloud services base URL. Shutting down.");
            System.exit(1);
        }

        Mono<Boolean> responseMono = configService.getInstanceId()
                .flatMap(instanceId -> WebClientUtils.create(
                                        cloudServicesConfig.getBaseUrl() + Url.USAGE_REPORT_URL
                                )
                                .post()
                                .contentType(MediaType.APPLICATION_JSON)
                                .accept(MediaType.APPLICATION_JSON)
                                .body(BodyInserters.fromValue(Map.of(
                                        FieldName.INSTANCE_ID, usagePulseReportDTO.getInstanceId(),
                                        FieldName.HASHED_INSTANCE_ID, usagePulseReportDTO.getHashedInstanceId(),
                                        FieldName.USAGE_DATA, usagePulseReportDTO.getUsageData()
                                )))
                                .retrieve()
                                .toEntity(byte[].class)
                )
                .map(responseEntity -> new String(responseEntity.getBody(), StandardCharsets.UTF_8))
                .map(body -> {
                    try {
                        JsonNode responseNode = objectMapper.readTree(body);

                        JsonNode responseStatus = responseNode.get("responseMeta").get("success");
                        if (responseStatus != null) {
                            boolean result = responseStatus.asBoolean();
                            if (result == true) {
                                log.debug("Successfully reported usage to Cloud Services");
                                return true;
                            }
                        }
                    } catch (JsonProcessingException e) {
                        // Incorrect response received from cloud services.
                        log.debug("ERROR : JSON Processing Exception - Invalid response structure from Cloud Services for Usage Report");
                    }
                    log.debug("Failed to report usage to Cloud Services");
                    return false;
                });

        return responseMono;
    }
}
