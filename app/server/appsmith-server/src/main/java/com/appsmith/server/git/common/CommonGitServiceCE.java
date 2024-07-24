package com.appsmith.server.git.common;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface CommonGitServiceCE {

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile);

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(
            GitProfile gitProfile, String defaultArtifactId);

    Mono<GitProfile> getDefaultGitProfileOrCreateIfEmpty();

    Mono<GitProfile> getGitProfileForUser(String defaultArtifactId);

    Mono<? extends Artifact> updateGitMetadata(
            String applicationId, GitArtifactMetadata gitArtifactMetadata, ArtifactType artifactType);

    Mono<GitArtifactMetadata> getGitArtifactMetadata(String defaultApplicationId, ArtifactType artifactType);

    Mono<GitAuth> generateSSHKey(String keyType);

    Mono<Boolean> testConnection(String defaultApplicationId, ArtifactType artifactType);

    Mono<List<GitDocsDTO>> getGitDocUrls();

    Mono<List<GitBranchDTO>> listBranchForArtifact(
            String defaultArtifactId, Boolean pruneBranches, String currentBranch, ArtifactType artifactType);

    // Git Operations: basic git operation of the interface

    Mono<? extends Artifact> createBranch(
            String defaultArtifactId, GitBranchDTO branchDTO, String srcBranch, ArtifactType artifactType);

    Mono<GitStatusDTO> getStatus(
            String defaultArtifactId, boolean compareRemote, String branchName, ArtifactType artifactType);

    Mono<List<GitLogDTO>> getCommitHistory(String branchName, String defaultArtifactId, ArtifactType artifactType);

    Mono<BranchTrackingStatus> fetchRemoteChanges(
            Artifact defaultArtifact, Artifact branchedArtifact, String branchName, boolean isFileLock);

    Mono<BranchTrackingStatus> fetchRemoteChanges(
            String defaultApplicationId, String branchName, boolean isFileLock, ArtifactType artifactType);

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

    Mono<? extends Artifact> deleteBranch(String defaultArtifactId, String branchName, ArtifactType artifactType);

    Mono<GitPullDTO> pullArtifact(String defaultArtifactId, String branchName, ArtifactType artifactType);

    Mono<String> pushArtifact(String defaultArtifactId, String branchName, ArtifactType artifactType);

    Mono<? extends Artifact> detachRemote(String defaultArtifactId, ArtifactType artifactType);

    Mono<MergeStatusDTO> mergeBranch(String applicationId, GitMergeDTO gitMergeDTO, ArtifactType artifactType);

    Mono<MergeStatusDTO> isBranchMergeable(String applicationId, GitMergeDTO gitMergeDTO, ArtifactType artifactType);

    Mono<String> createConflictedBranch(String defaultApplicationId, String branchName, ArtifactType artifactType);

    // Artifact Git OPS
    Mono<? extends Artifact> connectArtifactToGit(
            String defaultArtifactId, GitConnectDTO gitConnectDTO, String origin, ArtifactType artifactType);

    Mono<? extends Artifact> discardChanges(String defaultApplicationId, String branchName, ArtifactType artifactType);

    // Autocommit methods

    Mono<List<String>> updateProtectedBranches(
            String defaultArtifactId, List<String> branchNames, ArtifactType artifactType);

    Mono<List<String>> getProtectedBranches(String defaultArtifactId, ArtifactType artifactType);

    Mono<Boolean> toggleAutoCommitEnabled(String defaultArtifactId, ArtifactType artifactType);

    Mono<AutoCommitResponseDTO> getAutoCommitProgress(
            String applicationId, String branchName, ArtifactType artifactType);

    Mono<Boolean> autoCommitApplication(String defaultApplicationId, String branchName, ArtifactType artifactType);

    Mono<? extends ArtifactImportDTO> importArtifactFromGit(
            String workspaceId, GitConnectDTO gitConnectDTO, ArtifactType artifactType);
}
