package com.appsmith.server.solutions.ce;

import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.dtos.ReleaseNode;
import com.appsmith.server.helpers.ReleaseNotesUtils;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Slf4j
public class ReleaseNotesServiceCEImpl implements ReleaseNotesServiceCE {

    private final ProjectProperties projectProperties;

    private final ReleaseNotesUtils releaseNotesUtils;

    public List<ReleaseNode> releaseNodesCache = new ArrayList<>();

    private Instant cacheExpiryTime = null;

    public Mono<List<ReleaseNode>> getReleaseNodes() {
        // Moving the release notes fetch method to helper classes to have custom implementation for business edition
        return releaseNotesUtils.getReleaseNodes(releaseNodesCache, cacheExpiryTime);
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

    @Override
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

    @Override
    public String getRunningVersion() {
        return projectProperties.getVersion();
    }

    /**
     * Refresh the cached release notes every two hours.
     */
    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 2 * 60 * 1000 /* two minutes */, fixedRate = 2 * 60 * 60 * 1000 /* two hours */)
    @Observed(name = "refreshReleaseNotes")
    public void refreshReleaseNotes() {

        cacheExpiryTime = null; // Bust the release notes cache to force fetching again.
        getReleaseNodes()
                .map(releaseNodes -> {
                    cacheExpiryTime = Instant.now().plusSeconds(2 * 60 * 60);
                    return releaseNodes;
                })
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }

    public List<ReleaseNode> getReleaseNodesCache() {
        return releaseNodesCache;
    }

    public void setReleaseNodesCache(List<ReleaseNode> nodes) {
        this.releaseNodesCache = nodes;
    }
}
