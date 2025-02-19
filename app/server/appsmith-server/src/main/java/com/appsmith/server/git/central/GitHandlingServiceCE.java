package com.appsmith.server.git.central;

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

    Boolean isGitAuthInvalid(GitAuth gitAuth);

    // TODO: use only the required params
    Mono<Path> updateImportedRepositoryDetails(
            Artifact baseArtifact, ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<ArtifactType> obtainArtifactTypeFromGitRepository(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<String> fetchRemoteRepository(
            GitConnectDTO gitConnectDTO, GitAuth gitAuth, ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<String> fetchRemoteRepository(
            GitConnectDTO gitConnectDTO, GitAuth gitAuth, Artifact artifact, String repoName);

    Mono<? extends ArtifactExchangeJson> reconstructArtifactJsonFromGitRepository(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    void setRepositoryDetailsInGitArtifactMetadata(
            GitConnectDTO gitConnectDTO, GitArtifactMetadata gitArtifactMetadata);

    Mono<Boolean> removeRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    Mono<List<String>> listBranches(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO, Boolean checkRemoteBranches);

    Mono<List<String>> listBranches(ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    Mono<List<String>> listReferences(
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
}
