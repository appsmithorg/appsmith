package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ConfigService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReleaseNotesService {

    private final CloudServicesConfig cloudServicesConfig;

    private final ConfigService configService;

    public final List<ReleaseNode> releaseNodesCache = new ArrayList<>();

    private Instant cacheExpiryTime = null;

    private final ObjectMapper objectMapper;

    @Data
    static class Releases {
        private int totalCount;
        private List<ReleaseNode> nodes;
    }

    @Data
    @NoArgsConstructor
    public static class ReleaseNode {
        private String tagName;
        private String name;
        private String url;
        private String descriptionHtml;
        // The following are ISO timestamps. We are not parsing them since we don't use the values.
        private String createdAt;
        private String publishedAt;

        public ReleaseNode(String tagName) {
            this.tagName = tagName;
        }
    }

    public Mono<List<ReleaseNode>> getReleaseNodes() {
        if (cacheExpiryTime != null && Instant.now().isBefore(cacheExpiryTime)) {
            return Mono.justOrEmpty(releaseNodesCache);
        }

        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (StringUtils.isEmpty(baseUrl)) {
            return Mono.justOrEmpty(releaseNodesCache);
        }

        return configService.getInstanceId()
                .flatMap(instanceId -> {
                    WebClient.Builder webClientBuilder = WebClient.builder();
                    return webClientBuilder
                            .baseUrl(baseUrl + "/api/v1/releases?instanceId=" + instanceId)
                            .build()
                            .method(HttpMethod.GET)
                            .exchange();
                })
                .doOnError(error -> log.error("Error fetching release notes from CS Server : {}", String.valueOf(error)))
                // In case of an error in exchange with CS Server, stop processing further.
                .onErrorResume(error -> Mono.empty())
                .flatMap(clientResponse -> clientResponse.toEntity(String.class))
                .map(response -> {
                    ResponseDTO<Releases> releasesResponseDTO;
                    try {
                        releasesResponseDTO = objectMapper.readValue(response.toString(), ResponseDTO.class);
                    } catch (IOException e) {
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e));
                    }
                    return releasesResponseDTO;
                })
                .flatMap(result -> {
                    // If valid response, cast and return the nodes
                    if (result.getClass().isAssignableFrom(ResponseDTO.class)) {
                        return Mono.just(((ResponseDTO<Releases>)result).getData().getNodes());
                    } else {
                        // An error was returned by the cloud service. Stop the processing without
                        // throwing an error.
                        return Mono.empty();
                    }
                })
                .map(nodes -> {
                    releaseNodesCache.clear();
                    releaseNodesCache.addAll(nodes);
                    cacheExpiryTime = Instant.now().plusSeconds(2 * 60 * 60);
                    return nodes;
                });
    }

    public String computeNewFrom(String version) {
        if (CollectionUtils.isEmpty(releaseNodesCache)) {
            return "0";
        }

        int newCount = 0;

        for (ReleaseNode node : releaseNodesCache) {
            if (version == null || version.equals(node.getTagName())) {
                break;
            } else {
                ++newCount;
            }
        }

        return newCount == releaseNodesCache.size() ? ((newCount - 1) + "+") : String.valueOf(newCount);
    }

}
