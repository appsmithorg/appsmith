package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.GitConnectionLimitDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class GitCloudServicesUtils {
    private final CommonConfig commonConfig;
    private final ConfigService configService;
    private final CloudServicesConfig cloudServicesConfig;

    private final static Map<String, GitConnectionLimitDTO> gitLimitCache = new HashMap<>();

    public Mono<Integer> getPrivateRepoLimitForOrg(String orgId, boolean isClearCache) {
        final String baseUrl = cloudServicesConfig.getBaseUrl();
        return configService.getInstanceId().map(instanceId -> {
            if (commonConfig.isCloudHosting()) {
                return instanceId + "_" + orgId;
            } else {
                return instanceId;
            }
        }).flatMap(key -> {
            // check the cache for the repo limit
            if(Boolean.FALSE.equals(isClearCache) && gitLimitCache.containsKey(key)) {
                return Mono.just(gitLimitCache.get(key).getRepoLimit());
            }
            // Call the cloud service API
            return WebClient
                    .create(baseUrl + "/api/v1/git/limit/" + key)
                    .get()
                    .exchange()
                    .flatMap(response -> {
                        if (response.statusCode().is2xxSuccessful()) {
                            return response.bodyToMono(new ParameterizedTypeReference<ResponseDTO<Integer>>() {
                            });
                        } else {
                            return Mono.error(new AppsmithException(
                                    AppsmithError.CLOUD_SERVICES_ERROR,
                                    "Unable to connect to cloud-services with error status {}", response.statusCode()));
                        }
                    })
                    .map(ResponseDTO::getData)
                    // cache the repo limit
                    .map(limit -> {
                        GitConnectionLimitDTO gitConnectionLimitDTO = new GitConnectionLimitDTO();
                        gitConnectionLimitDTO.setRepoLimit(limit);
                        gitConnectionLimitDTO.setExpiryTime(Instant.now().plusSeconds(24 * 60 * 60));
                        gitLimitCache.put(key, gitConnectionLimitDTO);
                        return limit;
                    })
                    .doOnError(error -> log.error("Error fetching config from cloud services", error));
        });
    }
}
