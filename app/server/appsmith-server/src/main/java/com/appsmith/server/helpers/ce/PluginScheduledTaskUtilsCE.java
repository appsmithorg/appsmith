package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

import java.time.Instant;

public interface PluginScheduledTaskUtilsCE {

    Mono<Void> fetchAndUpdateRemotePlugins(Instant lastUpdatedAt);
}
