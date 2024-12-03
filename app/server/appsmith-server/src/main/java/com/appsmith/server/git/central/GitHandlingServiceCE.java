package com.appsmith.server.git.central;

import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface GitHandlingServiceCE {

    Set<String> validateGitConnectDTO(GitConnectDTO gitConnectDTO);

    String getRepoName(GitConnectDTO gitConnectDTO);

    Mono<Boolean> isRepoPrivate(GitConnectDTO gitConnectDTO);

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

    Mono<Boolean> validateEmptyRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO);

    Mono<Boolean> initialiseReadMe(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO,
            Artifact artifact,
            String readmeFileName,
            String originHeader);

    Mono<String> createFirstCommit(ArtifactJsonTransformationDTO jsonTransformationDTO, CommitDTO commitDTO);
}
