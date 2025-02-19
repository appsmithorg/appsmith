package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.Config;
import reactor.core.publisher.Mono;

public interface InstanceConfigHelperCE {

    Mono<? extends Config> registerInstance();

    Mono<Config> checkInstanceSchemaVersion();

    Mono<Void> performRtsHealthCheck();

    boolean getIsRtsAccessible();

    Mono<Boolean> isLicenseValid();

    Mono<Void> updateCacheForOrganizationFeatureFlags();
}
