package com.appsmith.server.git.common;

import com.appsmith.external.dtos.GitBranchDTO;
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

    Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile, String baseArtifactId);

    Mono<GitProfile> getDefaultGitProfileOrCreateIfEmpty();

    Mono<GitProfile> getGitProfileForUser(String baseArtifactId);

    Mono<? extends Artifact> updateGitMetadata(
            String applicationId, GitArtifactMetadata gitArtifactMetadata, ArtifactType artifactType);

    Mono<GitArtifactMetadata> getGitArtifactMetadata(String baseArtifactId, ArtifactType artifactType);

    Mono<GitAuth> generateSSHKey(String keyType);

    Mono<List<GitDocsDTO>> getGitDocUrls();

    Mono<List<GitBranchDTO>> listBranchForArtifact(
            String branchedArtifactId, Boolean pruneBranches, ArtifactType artifactType);

    // Git Operations: basic git operation of the interface

    Mono<? extends Artifact> createBranch(String branchedArtifactId, GitBranchDTO branchDTO, ArtifactType artifactType);

    Mono<GitStatusDTO> getStatus(String branchedArtifactId, boolean compareRemote, ArtifactType artifactType);

    Mono<BranchTrackingStatus> fetchRemoteChanges(Artifact baseArtifact, Artifact branchedArtifact, boolean isFileLock);

    Mono<BranchTrackingStatus> fetchRemoteChanges(
            String branchedArtifactId, boolean isFileLock, ArtifactType artifactType);

    Mono<String> commitArtifact(
            GitCommitDTO commitDTO, String branchedArtifactId, boolean doAmend, ArtifactType artifactType);

    Mono<String> commitArtifact(GitCommitDTO commitDTO, String branchedArtifactId, ArtifactType artifactType);

    Mono<? extends Artifact> checkoutBranch(
            String branchedArtifactId, String branchToBeCheckedOut, boolean addFileLock, ArtifactType artifactType);

    Mono<? extends Artifact> deleteBranch(String baseArtifactId, String branchName, ArtifactType artifactType);

    Mono<GitPullDTO> pullArtifact(String branchedArtifactId, ArtifactType artifactType);

    Mono<String> pushArtifact(String branchedArtifactId, ArtifactType artifactType);

    Mono<? extends Artifact> detachRemote(String branchedArtifactId, ArtifactType artifactType);

    Mono<MergeStatusDTO> mergeBranch(String branchedArtifactId, GitMergeDTO gitMergeDTO, ArtifactType artifactType);

    Mono<MergeStatusDTO> isBranchMergeable(
            String branchedArtifactId, GitMergeDTO gitMergeDTO, ArtifactType artifactType);

    // Artifact Git OPS
    Mono<? extends Artifact> connectArtifactToGit(
            String baseArtifactId, GitConnectDTO gitConnectDTO, String origin, ArtifactType artifactType);

    Mono<? extends Artifact> discardChanges(String branchedArtifactId, ArtifactType artifactType);

    // Autocommit methods

    Mono<List<String>> updateProtectedBranches(
            String baseArtifactId, List<String> branchNames, ArtifactType artifactType);

    Mono<List<String>> getProtectedBranches(String baseArtifactId, ArtifactType artifactType);

    Mono<Boolean> toggleAutoCommitEnabled(String baseArtifactId, ArtifactType artifactType);

    Mono<AutoCommitResponseDTO> getAutoCommitProgress(
            String applicationId, String branchName, ArtifactType artifactType);

    Mono<? extends ArtifactImportDTO> importArtifactFromGit(
            String workspaceId, GitConnectDTO gitConnectDTO, ArtifactType artifactType);
}
