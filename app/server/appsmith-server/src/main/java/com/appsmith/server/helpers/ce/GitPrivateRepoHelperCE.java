package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

public interface GitPrivateRepoHelperCE {

    Mono<Boolean> isRepoLimitReached(String workspaceId, Boolean isClearCache);
}
