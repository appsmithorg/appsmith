package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.GitApplicationMetadata;
import reactor.core.publisher.Mono;

public interface GitRepoHelperCE {

    Mono<Boolean> isRepoLimitReached(String workspaceId, Boolean isClearCache);

    Mono<Boolean> isProtectedBranch(String branchName, GitApplicationMetadata gitApplicationMetadata);
}
