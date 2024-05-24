package com.appsmith.server.helpers.ce.autocommit;

import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.dtos.PageDTO;
import reactor.core.publisher.Mono;

public interface AutoCommitEligibiltyHelper {

    Mono<Boolean> isServerAutoCommitRequired(String workspaceId, GitArtifactMetadata gitMetadata);

    Mono<Boolean> isClientMigrationRequired(PageDTO pageDTO);

    Mono<AutoCommitTriggerDTO> isAutoCommitRequired(
            String workspaceId, GitArtifactMetadata gitArtifactMetadata, PageDTO pageDTO);
}
