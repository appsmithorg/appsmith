package com.appsmith.server.helpers;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.SegmentConfig;
import com.appsmith.server.dtos.ReleaseNode;
import com.appsmith.server.helpers.ce.ReleaseNotesUtilsCEImpl;
import com.appsmith.server.services.ConfigService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
public class ReleaseNotesUtilsImpl extends ReleaseNotesUtilsCEImpl implements ReleaseNotesUtils {

    private final AirgapInstanceConfig airgapInstanceConfig;

    public ReleaseNotesUtilsImpl(CloudServicesConfig cloudServicesConfig,
                                 CommonConfig commonConfig,
                                 SegmentConfig segmentConfig,
                                 ConfigService configService,
                                 ProjectProperties projectProperties,
                                 AirgapInstanceConfig airgapInstanceConfig) {

        super(cloudServicesConfig, commonConfig, segmentConfig, configService, projectProperties);
        this.airgapInstanceConfig = airgapInstanceConfig;
    }

    @Override
    public Mono<List<ReleaseNode>> getReleaseNodes(List<ReleaseNode> releaseNodesCache, Instant cacheExpiryTime) {

        if (airgapInstanceConfig.isAirgapEnabled()) {
            return Mono.just(new ArrayList<>());
        }
        return super.getReleaseNodes(releaseNodesCache, cacheExpiryTime);
    }
}
