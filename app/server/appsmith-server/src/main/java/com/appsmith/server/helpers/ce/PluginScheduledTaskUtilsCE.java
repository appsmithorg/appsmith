/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.helpers.ce;

import java.time.Instant;
import reactor.core.publisher.Mono;

public interface PluginScheduledTaskUtilsCE {

  Mono<Void> fetchAndUpdateRemotePlugins(Instant lastUpdatedAt);
}
