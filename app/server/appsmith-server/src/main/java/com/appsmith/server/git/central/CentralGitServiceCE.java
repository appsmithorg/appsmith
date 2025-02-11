package com.appsmith.server.git.central;

import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CentralGitServiceCE {

    Mono<? extends ArtifactImportDTO> importArtifactFromGit(
            String workspaceId, GitConnectDTO gitConnectDTO, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> connectArtifactToGit(
            String baseArtifactId,
            ArtifactType artifactType,
            GitConnectDTO gitConnectDTO,
            String originHeader,
            GitType gitType);

    Mono<String> commitArtifact(
            CommitDTO commitDTO, String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> detachRemote(String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<List<GitRefDTO>> listBranchForArtifact(
            String branchedArtifactId, ArtifactType artifactType, Boolean pruneBranches, GitType gitType);

    Mono<String> fetchRemoteChanges(
            String referenceArtifactId,
            ArtifactType artifactType,
            boolean isFileLock,
            GitType gitType,
            RefType refType);

    Mono<MergeStatusDTO> mergeBranch(
            String branchedArtifactId, ArtifactType artifactType, GitMergeDTO gitMergeDTO, GitType gitType);

    Mono<MergeStatusDTO> isBranchMergable(
            String branchedArtifactId, ArtifactType artifactType, GitMergeDTO gitMergeDTO, GitType gitType);

    Mono<? extends Artifact> discardChanges(String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<GitStatusDTO> getStatus(
            String branchedArtifactId, ArtifactType artifactType, boolean compareRemote, GitType gitType);

    Mono<GitPullDTO> pullArtifact(String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> checkoutReference(
            String referenceArtifactId,
            ArtifactType artifactType,
            GitRefDTO gitRefDTO,
            boolean addFileLock,
            GitType gitType);

    Mono<? extends Artifact> createReference(
            String referencedArtifactId, ArtifactType artifactType, GitRefDTO refDTO, GitType gitType);

    Mono<? extends Artifact> deleteGitReference(
            String baseArtifactId, ArtifactType artifactType, String refName, RefType refType, GitType gitType);

    Mono<List<String>> updateProtectedBranches(
            String baseArtifactId, ArtifactType artifactType, List<String> branchNames);

    Mono<List<String>> getProtectedBranches(String baseArtifactId, ArtifactType artifactType);

    Mono<Boolean> toggleAutoCommitEnabled(String baseArtifactId, ArtifactType artifactType);

    Mono<AutoCommitResponseDTO> getAutoCommitProgress(
            String baseArtifactId, ArtifactType artifactType, String branchName);

    Mono<GitAuth> generateSSHKey(String keyType);

    Mono<GitArtifactMetadata> getGitArtifactMetadata(String baseArtifactId, ArtifactType artifactType);

    Mono<List<GitDocsDTO>> getGitDocUrls();
}
