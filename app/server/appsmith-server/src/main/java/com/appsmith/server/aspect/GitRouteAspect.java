package com.appsmith.server.aspect;

import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.server.artifacts.gitRoute.GitRouteArtifact;
import com.appsmith.server.aspect.ce.GitRouteAspectCE;
import com.appsmith.server.git.utils.GitProfileUtils;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class GitRouteAspect extends GitRouteAspectCE {

    public GitRouteAspect(
            ReactiveRedisTemplate<String, String> redis,
            GitProfileUtils gitProfileUtils,
            GitServiceConfig gitServiceConfig,
            GitRouteArtifact gitRouteArtifact,
            ObservationRegistry observationRegistry) {
        super(redis, gitProfileUtils, gitServiceConfig, gitRouteArtifact, observationRegistry);
    }
}
