package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.server.constants.ArtifactType;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import reactor.core.publisher.Mono;

public interface CommonGitServiceCE {

    Mono<GitStatusDTO> getStatus(String defaultArtifactId, boolean compareRemote, String branchName);

    Mono<BranchTrackingStatus> fetchRemoteChanges(
            String defaultApplicationId, String branchName, boolean isFileLock, ArtifactType artifactType);
}
