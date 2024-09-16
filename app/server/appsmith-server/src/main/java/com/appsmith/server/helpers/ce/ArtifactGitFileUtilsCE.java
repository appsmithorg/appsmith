package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import lombok.NonNull;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.util.Map;

public interface ArtifactGitFileUtilsCE<T extends ArtifactGitReference> {

    T createArtifactReferenceObject();

    Mono<ArtifactExchangeJson> reconstructArtifactExchangeJsonFromFilesInRepository(
            String workspaceId, String baseArtifactId, String repoName, String branchName);

    void addArtifactReferenceFromExportedJson(
            ArtifactExchangeJson artifactExchangeJson, ArtifactGitReference artifactGitReference);

    Map<String, String> getConstantsMap();

    Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName, @NonNull String... args);
}
