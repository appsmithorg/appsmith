package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import com.appsmith.server.dtos.PageDTO;
import reactor.core.publisher.Mono;

public interface AutoCommitEligibilityHelper {

    Mono<Boolean> isServerAutoCommitRequired(String workspaceId, GitArtifactMetadata gitMetadata);

    Mono<Boolean> isClientMigrationRequired(PageDTO pageDTO);

    Mono<Boolean> isClientMigrationRequiredFSOps(String workspaceId, GitArtifactMetadata gitMetadata, PageDTO pageDTO);

    Mono<AutoCommitTriggerDTO> isAutoCommitRequired(
            String workspaceId, GitArtifactMetadata gitArtifactMetadata, PageDTO pageDTO);
}
