package com.appsmith.server.git.central;

import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitPullDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CentralGitServiceCE {

    Mono<? extends ArtifactImportDTO> importArtifactFromGit(
            String workspaceId, GitConnectDTO gitConnectDTO, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> connectArtifactToGit(
            String baseArtifactId,
            GitConnectDTO gitConnectDTO,
            String originHeader,
            ArtifactType artifactType,
            GitType gitType);

    Mono<String> commitArtifact(
            CommitDTO commitDTO, String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> detachRemote(String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<String> fetchRemoteChanges(
            String referenceArtifactId,
            boolean isFileLock,
            ArtifactType artifactType,
            GitType gitType,
            RefType refType);

    Mono<? extends Artifact> discardChanges(String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<GitStatusDTO> getStatus(
            String branchedArtifactId, boolean compareRemote, ArtifactType artifactType, GitType gitType);

    Mono<GitPullDTO> pullArtifact(String branchedArtifactId, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> checkoutReference(
            String referenceArtifactId,
            GitRefDTO gitRefDTO,
            boolean addFileLock,
            ArtifactType artifactType,
            GitType gitType);

    Mono<? extends Artifact> createReference(
            String referencedArtifactId, GitRefDTO refDTO, ArtifactType artifactType, GitType gitType);

    Mono<? extends Artifact> deleteGitReference(
            String baseArtifactId, GitRefDTO gitRefDTO, ArtifactType artifactType, GitType gitType);

    Mono<List<String>> updateProtectedBranches(
            String baseArtifactId, List<String> branchNames, ArtifactType artifactType);

    Mono<List<String>> getProtectedBranches(String baseArtifactId, ArtifactType artifactType);

    Mono<Boolean> toggleAutoCommitEnabled(String baseArtifactId, ArtifactType artifactType);

    Mono<AutoCommitResponseDTO> getAutoCommitProgress(
            String baseArtifactId, String branchName, ArtifactType artifactType);
}
