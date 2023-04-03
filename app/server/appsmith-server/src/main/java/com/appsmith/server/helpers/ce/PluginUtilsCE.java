package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

import java.time.Instant;

public interface PluginUtilsCE {

    Mono<Void> fetchAndUpdateRemotePlugins(Instant lastUpdatedAt);

}
