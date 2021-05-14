package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ConfigService;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReleaseNotesService {

    private final CloudServicesConfig cloudServicesConfig;

    private final SegmentConfig segmentConfig;

    private final ConfigService configService;

    private final ProjectProperties projectProperties;

    public final List<ReleaseNode> releaseNodesCache = new ArrayList<>();

    private Instant cacheExpiryTime = null;

    @Value("${github_repo}")
    private String repo;

    @Value("${is.cloud-hosted:false}")
    private boolean isCloudHosted;

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
                .flatMap(instanceId -> WebClient
                        .create(
                                baseUrl + "/api/v1/releases?instanceId=" + instanceId +
                                        // isCloudHosted should be true only for our cloud instance,
                                        // For docker images that burn the segment key with the image, the CE key will be present
                                        "&isSourceInstall=" + (isCloudHosted || StringUtils.isEmpty(segmentConfig.getCeKey())) +
                                        (StringUtils.isEmpty(repo) ? "" : ("&repo=" + repo))
                        )
                        .get()
                        .exchange()
                )
                .flatMap(response -> response.bodyToMono(new ParameterizedTypeReference<ResponseDTO<Releases>>() {}))
                .map(result -> result.getData().getNodes())
                .map(nodes -> {
                    releaseNodesCache.clear();
                    releaseNodesCache.addAll(nodes);
                    cacheExpiryTime = Instant.now().plusSeconds(2 * 60 * 60);
                    return nodes;
                })
                .doOnError(error -> log.error("Error fetching release notes from cloud services", error));
    }

    public String computeNewFrom(String version) {
        if (CollectionUtils.isEmpty(releaseNodesCache) || StringUtils.isEmpty(version)) {
            return "0";
        }

        int newCount = 0;

        for (ReleaseNode node : releaseNodesCache) {
            if (version.equals(node.getTagName())) {
                break;
            } else {
                ++newCount;
            }
        }

        return newCount == releaseNodesCache.size() ? ((newCount - 1) + "+") : String.valueOf(newCount);
    }

    public String getReleasedVersion() {
        final String version = projectProperties.getVersion();

        if (!version.endsWith("-SNAPSHOT")) {
            return version;
        }

        if (CollectionUtils.isEmpty(releaseNodesCache)) {
            return "";
        }

        return releaseNodesCache.get(0).getTagName();
    }

    /**
     * Refresh the cached release notes every two hours.
     */
    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 2 * 60 * 1000 /* two minutes */, fixedRate = 2 * 60 * 60 * 1000 /* two hours */)
    public void refreshReleaseNotes() {
        cacheExpiryTime = null;  // Bust the release notes cache to force fetching again.
        getReleaseNodes()
                .subscribeOn(Schedulers.elastic())
                .subscribe();
    }

}
