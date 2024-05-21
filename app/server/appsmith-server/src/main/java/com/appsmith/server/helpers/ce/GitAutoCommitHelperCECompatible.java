package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.GitArtifactMetadata;
import reactor.core.publisher.Mono;

public interface GitAutoCommitHelperCECompatible {

    Mono<Boolean> autoCommitClientMigration(String defaultApplicationId, String branchName);

    Mono<Boolean> autoCommitServerMigration(String defaultApplicationId, String branchName);

    Mono<Boolean> isServerAutocommitRequired(String workspaceId, GitArtifactMetadata gitMetadata);
}
