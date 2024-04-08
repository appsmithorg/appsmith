package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.GitArtifactMetadata;
import reactor.core.publisher.Mono;

public interface GitPrivateRepoHelperCE {

    Mono<Boolean> isRepoLimitReached(String workspaceId, Boolean isClearCache);

    Mono<Boolean> isBranchProtected(GitArtifactMetadata metaData, String branchName);
}
