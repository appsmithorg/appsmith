package com.appsmith.server.helpers.ce;

import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import lombok.NonNull;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.util.Map;

public interface ArtifactGitFileUtilsCE<T extends ArtifactExchangeJson> {

    default ArtifactGitReference createArtifactReferenceObject() {
        return null;
    }

    ArtifactExchangeJson createArtifactExchangeJsonObject();

    void setArtifactDependentResources(ArtifactExchangeJson artifactExchangeJson, GitResourceMap gitResourceMap);

    default Mono<ArtifactExchangeJson> reconstructArtifactExchangeJsonFromFilesInRepository(
            String workspaceId, String baseArtifactId, String repoName, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    default void addArtifactReferenceFromExportedJson(
            ArtifactExchangeJson artifactExchangeJson, ArtifactGitReference artifactGitReference) {}

    Map<String, String> getConstantsMap();

    Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName, @NonNull String... args);

    void setArtifactDependentPropertiesInJson(GitResourceMap gitResourceMap, ArtifactExchangeJson artifactExchangeJson);

    Mono<? extends ArtifactExchangeJson> performJsonMigration(
            ArtifactJsonTransformationDTO jsonTransformationDTO, ArtifactExchangeJson artifactExchangeJson);
}
