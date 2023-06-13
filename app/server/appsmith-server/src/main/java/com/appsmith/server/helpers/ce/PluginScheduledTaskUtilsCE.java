/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

import java.time.Instant;

public interface PluginScheduledTaskUtilsCE {

    Mono<Void> fetchAndUpdateRemotePlugins(Instant lastUpdatedAt);
}
