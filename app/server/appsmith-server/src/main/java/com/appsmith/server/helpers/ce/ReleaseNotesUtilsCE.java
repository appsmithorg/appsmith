package com.appsmith.server.helpers.ce;

import com.appsmith.server.dtos.ReleaseNode;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;

public interface ReleaseNotesUtilsCE {

    Mono<List<ReleaseNode>> getReleaseNodes(List<ReleaseNode> releaseNodesCache, Instant cacheExpiryTime);
}
