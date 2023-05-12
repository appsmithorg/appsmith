package com.appsmith.server.services;

import com.appsmith.server.services.ce.FeatureFlagServiceCE;
import reactor.core.publisher.Mono;

public interface FeatureFlagService extends FeatureFlagServiceCE {


    Mono<Void> refreshFeatureFlagsForAllUsers();
}
