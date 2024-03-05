package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitConnectDTO;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface CommonGitServiceCE {

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile);

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(
            GitProfile gitProfile, String defaultArtifactId);

    Mono<GitStatusDTO> getStatus(String defaultArtifactId, boolean compareRemote, String branchName);

    Mono<BranchTrackingStatus> fetchRemoteChanges(
            String defaultApplicationId, String branchName, boolean isFileLock, ArtifactType artifactType);

    Mono<? extends Artifact> connectArtifactToGit(
            String defaultArtifactId, GitConnectDTO gitConnectDTO, String origin, ArtifactType artifactType);

    Mono<? extends Artifact> detachRemote(String defaultArtifactId, ArtifactType artifactType);
}
