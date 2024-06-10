package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import com.appsmith.server.dtos.PageDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static java.lang.Boolean.FALSE;

@Slf4j
@Component
public class AutoCommitEligibilityHelperFallbackImpl implements AutoCommitEligibilityHelper {

    @Override
    public Mono<Boolean> isServerAutoCommitRequired(String workspaceId, GitArtifactMetadata gitMetadata) {
        return Mono.just(FALSE);
    }

    @Override
    public Mono<Boolean> isClientMigrationRequired(PageDTO pageDTO) {
        return Mono.just(FALSE);
    }

    @Override
    public Mono<Boolean> isClientMigrationRequiredFSOps(
            String workspaceId, GitArtifactMetadata gitMetadata, PageDTO pageDTO) {
        return Mono.just(FALSE);
    }

    @Override
    public Mono<AutoCommitTriggerDTO> isAutoCommitRequired(
            String workspaceId, GitArtifactMetadata gitArtifactMetadata, PageDTO pageDTO) {
        return Mono.just(new AutoCommitTriggerDTO(FALSE, FALSE, FALSE));
    }
}
