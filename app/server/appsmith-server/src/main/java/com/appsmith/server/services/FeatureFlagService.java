package com.appsmith.server.services;

import com.appsmith.server.featureflags.FeatureFlagTrait;
import com.appsmith.server.services.ce.FeatureFlagServiceCE;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface FeatureFlagService extends FeatureFlagServiceCE {
    Mono<Void> refreshFeatureFlagsForAllUsers();

    Mono<Void> remoteSetUserTraits(List<FeatureFlagTrait> featureFlagTraits);
}