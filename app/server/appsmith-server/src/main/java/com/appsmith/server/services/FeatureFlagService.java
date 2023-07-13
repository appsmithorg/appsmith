package com.appsmith.server.services;

import com.appsmith.server.services.ce.FeatureFlagServiceCE;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface FeatureFlagService extends FeatureFlagServiceCE {
    Mono<Map<String, Boolean>> getAllFeatureFlagsForUser();
}
