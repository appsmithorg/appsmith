package com.appsmith.server.git.central;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.dtos.FetchRemoteDTO;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.nio.file.Path;
import java.util.List;
import java.util.Set;

public interface GitHandlingServiceCE {

    Set<String> validateGitConnectDTO(GitConnectDTO gitConnectDTO);

    String getRepoName(GitConnectDTO gitConnectDTO);

    Mono<Boolean> isRepoPrivate(GitConnectDTO gitConnectDTO);

    Mono<Boolean> isRepoPrivate(GitArtifactMetadata gitArtifactMetadata);

    // TODO: modify git auth class for native implementation
    Mono<GitAuth> getGitAuthForUser();

    /**
     * Get GitAuth for the current user based on the GitConnectDTO.
     * If sshKeyId is provided in the DTO, looks up the SSH key by ID and verifies
     * that the current user has access (either as owner or shared).
     * If sshKeyId is not provided, falls back to the user's default deploy key.
     *
     * @param gitConnectDTO the connection DTO potentially containing sshKeyId
     * @return Mono containing the GitAuth for authentication
     */
    Mono<GitAuth> getGitAuthForUser(GitConnectDTO gitConnectDTO);

    Boolean isGitAuthInvalid(GitAuth gitAuth);

    // TODO: use only the required params
    Mono<Path> updateImportedRepositoryDetails(
            Artifact baseArtifact, ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<ArtifactType> obtainArtifactTypeFromGitRepository(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<Tuple2<ArtifactType, String>> obtainArtifactTypeAndIdentifierFromGitRepository(
            ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<String> fetchRemoteRepository(
            GitConnectDTO gitConnectDTO, GitAuth gitAuth, ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<String> fetchRemoteRepository(
            GitConnectDTO gitConnectDTO, GitAuth gitAuth, Artifact artifact, String repoName);

    Mono<? extends ArtifactExchangeJson> reconstructArtifactJsonFromGitRepository(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    void setRepositoryDetailsInGitArtifactMetadata(
            GitConnectDTO gitConnectDTO, GitArtifactMetadata gitArtifactMetadata);

    Mono<Boolean> removeRepository(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO, Boolean isArtifactTypeUnknown);

    Mono<Boolean> removeRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    Mono<List<GitRefDTO>> listBranches(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO, Boolean checkRemoteBranches);

    Mono<List<GitRefDTO>> listBranches(ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    Mono<List<GitRefDTO>> listReferences(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO, Boolean checkRemoteReferences);

    Mono<String> getDefaultBranchFromRepository(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitArtifactMetadata gitArtifactMetadata);

    Mono<Boolean> validateEmptyRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    Mono<Boolean> initialiseReadMe(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO,
            Artifact artifact,
            String readmeFileName,
            String originHeader);

    Mono<String> createFirstCommit(ArtifactJsonTransformationDTO jsonTransformationDTO, CommitDTO commitDTO);

    Mono<Boolean> prepareChangesToBeCommitted(
            ArtifactJsonTransformationDTO jsonTransformationDTO, ArtifactExchangeJson artifactExchangeJson);

    Mono<Tuple2<? extends Artifact, String>> commitArtifact(
            Artifact branchedArtifact, CommitDTO commitDTO, ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<String> fetchRemoteReferences(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitAuth gitAuth, Boolean isFetchAll);

    Mono<String> fetchRemoteReferences(
            ArtifactJsonTransformationDTO jsonTransformationDTO, FetchRemoteDTO fetchRemoteDTO, GitAuth gitAuth);

    Mono<BranchTrackingStatus> getBranchTrackingStatus(ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    Mono<String> mergeBranches(ArtifactJsonTransformationDTO jsonTransformationDTO, GitMergeDTO gitMergeDTO);

    Mono<MergeStatusDTO> isBranchMergable(ArtifactJsonTransformationDTO JsonTransformationDTO, GitMergeDTO gitMergeDTO);

    Mono<? extends ArtifactExchangeJson> recreateArtifactJsonFromLastCommit(
            ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<GitStatusDTO> getStatus(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<String> createGitReference(
            ArtifactJsonTransformationDTO baseRefJsonTransformationDTO,
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO,
            GitArtifactMetadata baseGitData,
            GitRefDTO gitRefDTO);

    Mono<String> checkoutRemoteReference(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<Boolean> deleteGitReference(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<Boolean> checkoutArtifact(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<MergeStatusDTO> pullArtifact(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitArtifactMetadata baseMetadata);

    /**
     * Removes leftover Git lock and index files for the repository referenced by the provided DTO
     * to unblock subsequent Git operations.
     *
     * <p>This is a best-effort cleanup that deletes ".git/index.lock" and ".git/index" if present.
     * For in-memory Git repositories, this is a no-op.</p>
     *
     * @param jsonTransformationDTO DTO carrying repository identification and context used to resolve the path
     * @return a Mono that emits TRUE after the cleanup attempt has been scheduled
     */
    Mono<Boolean> removeDanglingLocks(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<List<GitLogDTO>> getCommitHistory(Artifact branchedArtifact);
}
