/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.helpers.ce;

import com.appsmith.server.dtos.ReleaseNode;
import java.time.Instant;
import java.util.List;
import reactor.core.publisher.Mono;

public interface ReleaseNotesUtilsCE {

Mono<List<ReleaseNode>> getReleaseNodes(
	List<ReleaseNode> releaseNodesCache, Instant cacheExpiryTime);
}
