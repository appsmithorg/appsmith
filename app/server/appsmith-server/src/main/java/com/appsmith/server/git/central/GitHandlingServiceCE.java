package com.appsmith.server.git.central;

import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

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

    Mono<Boolean> validateEmptyRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    Mono<Boolean> initialiseReadMe(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO,
            Artifact artifact,
            String readmeFileName,
            String originHeader);

    Mono<String> createFirstCommit(ArtifactJsonTransformationDTO jsonTransformationDTO, CommitDTO commitDTO);

    // TODO: provide a proper name
    Mono<Boolean> prepareChangesToBeCommitted(
            ArtifactJsonTransformationDTO jsonTransformationDTO, ArtifactExchangeJson artifactExchangeJson);

    Mono<Tuple2<? extends Artifact, String>> commitArtifact(
            Artifact branchedArtifact, CommitDTO commitDTO, ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<String> fetchRemoteChanges(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitAuth gitAuth, Boolean isFetchAll);

    Mono<? extends ArtifactExchangeJson> recreateArtifactJsonFromLastCommit(
            ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<GitStatusDTO> getStatus(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<String> createGitReference(ArtifactJsonTransformationDTO artifactJsonTransformationDTO, GitRefDTO gitRefDTO);

    Mono<Boolean> deleteGitReference(ArtifactJsonTransformationDTO jsonTransformationDTO);

    Mono<Boolean> checkoutArtifact(ArtifactJsonTransformationDTO jsonTransformationDTO);
}
