package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitPullDTO;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface CommonGitServiceCE {

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile);

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(
            GitProfile gitProfile, String defaultArtifactId);

    Mono<? extends Artifact> updateGitMetadata(
            String applicationId, GitArtifactMetadata gitArtifactMetadata, ArtifactType artifactType);

    Mono<GitAuth> generateSSHKey(String keyType);

    // Git Operations: basic git operation of the interface

    Mono<? extends Artifact> createBranch(
            String defaultArtifactId, GitBranchDTO branchDTO, String srcBranch, ArtifactType artifactType);

    Mono<GitStatusDTO> getStatus(String defaultArtifactId, boolean compareRemote, String branchName);

    Mono<List<GitLogDTO>> getCommitHistory(String branchName, String defaultArtifactId, ArtifactType artifactType);

    Mono<BranchTrackingStatus> fetchRemoteChanges(
            String defaultApplicationId, String branchName, boolean isFileLock, ArtifactType artifactType);

    Mono<GitPullDTO> pullArtifact(String defaultArtifactId, String branchName, ArtifactType artifactType);

    Mono<String> pushArtifact(String defaultArtifactId, String branchName, ArtifactType artifactType);

    Mono<String> commitArtifact(
            GitCommitDTO commitDTO,
            String defaultArtifactId,
            String branchName,
            boolean doAmend,
            ArtifactType artifactType);

    Mono<String> commitArtifact(
            GitCommitDTO commitDTO, String defaultApplicationId, String branchName, ArtifactType artifactType);

    Mono<? extends Artifact> checkoutBranch(
            String defaultArtifactId, String branchName, boolean addFileLock, ArtifactType artifactType);

    Mono<? extends Artifact> detachRemote(String defaultArtifactId, ArtifactType artifactType);

    // Artifact Git OPS
    Mono<? extends Artifact> connectArtifactToGit(
            String defaultArtifactId, GitConnectDTO gitConnectDTO, String origin, ArtifactType artifactType);
}
