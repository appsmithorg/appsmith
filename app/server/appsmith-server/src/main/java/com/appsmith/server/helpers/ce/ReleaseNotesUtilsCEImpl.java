package com.appsmith.server.helpers.ce;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.domains.Releases;
import com.appsmith.server.dtos.ReleaseNode;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ConfigService;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class ReleaseNotesUtilsCEImpl implements ReleaseNotesUtilsCE {

    private final CloudServicesConfig cloudServicesConfig;

    private final CommonConfig commonConfig;

    private final SegmentConfig segmentConfig;

    private final ConfigService configService;

    private final ProjectProperties projectProperties;

    @Override
    public Mono<List<ReleaseNode>> getReleaseNodes(List<ReleaseNode> releaseNodesCache, Instant cacheExpiryTime) {

        if (cacheExpiryTime != null && Instant.now().isBefore(cacheExpiryTime)) {
            return Mono.justOrEmpty(releaseNodesCache);
        }

        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (!StringUtils.hasLength(baseUrl)) {
            return Mono.justOrEmpty(releaseNodesCache);
        }

        return configService
                .getInstanceId()
                .flatMap(instanceId -> WebClientUtils.create(baseUrl + "/api/v1/releases?instanceId=" + instanceId +
                                // isCloudHosted should be true only for our cloud instance,
                                // For docker images that burn the segment key with the image, the CE key will be
                                // present
                                "&isSourceInstall="
                                + (commonConfig.isCloudHosting() || StringUtils.isEmpty(segmentConfig.getCeKey()))
                                + (StringUtils.isEmpty(commonConfig.getRepo())
                                        ? ""
                                        : ("&repo=" + commonConfig.getRepo()))
                                + "&version="
                                + projectProperties.getVersion() + "&edition="
                                + ProjectProperties.EDITION)
                        .get()
                        .exchange())
                .flatMap(response -> response.bodyToMono(new ParameterizedTypeReference<ResponseDTO<Releases>>() {}))
                .map(result -> result.getData().getNodes())
                .map(nodes -> {
                    releaseNodesCache.clear();
                    releaseNodesCache.addAll(nodes);
                    return nodes;
                })
                .doOnError(error -> log.error("Error fetching release notes from cloud services", error));
    }
}
