package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.GitArtifactMetadata;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class GitAutoCommitHelperCECompatibleImpl implements GitAutoCommitHelperCECompatible {

    @Override
    public Mono<Boolean> autoCommitClientMigration(String defaultApplicationId, String branchName) {
        return Mono.just(Boolean.FALSE);
    }

    @Override
    public Mono<Boolean> autoCommitServerMigration(String defaultApplicationId, String branchName) {
        return Mono.just(Boolean.FALSE);
    }

    @Override
    public Mono<Boolean> isServerAutocommitRequired(String workspaceId, GitArtifactMetadata gitMetadata) {
        return Mono.just(Boolean.FALSE);
    }
}
