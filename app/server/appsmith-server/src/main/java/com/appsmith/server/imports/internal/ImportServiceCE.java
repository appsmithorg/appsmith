package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ImportServiceCE {

    /**
     * This method provides the importService specific to the artifact based on the ArtifactType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param artifactExchangeJson : Entity Json which is implementing the artifactExchangeJson
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    ArtifactBasedImportService<? extends Artifact, ? extends ArtifactImportDTO, ? extends ArtifactExchangeJson>
            getArtifactBasedImportService(ArtifactExchangeJson artifactExchangeJson);

    /**
     * This method provides the importService specific to the artifact based on the ArtifactType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param artifactType : Type of Json serialisation
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    ArtifactBasedImportService<? extends Artifact, ? extends ArtifactImportDTO, ? extends ArtifactExchangeJson>
            getArtifactBasedImportService(ArtifactType artifactType);

    /**
     * This method takes a file part and makes a Json entity which implements the ArtifactExchangeJson interface
     *
     * @param filePart : filePart from which the contents would be made
     * @return : Json entity which implements ArtifactExchangeJson
     */
    Mono<? extends ArtifactExchangeJson> extractArtifactExchangeJson(Part filePart);

    Mono<String> readFilePartToString(Part file);

    Mono<? extends ArtifactExchangeJson> extractArtifactExchangeJson(String jsonString);

    /**
     * Hydrates an Artifact within the specified workspace by saving the provided JSON file.
     *
     * @param filePart    The filePart representing the Artifact object to be saved.
     *                    The Artifact implements the Artifact interface.
     * @param workspaceId The identifier for the destination workspace.
     * @param artifactId
     */
    Mono<? extends ArtifactImportDTO> extractArtifactExchangeJsonAndSaveArtifact(
            Part filePart, String workspaceId, String artifactId);

    /**
     * Hydrates an Artifact within the specified workspace by saving the provided JSON file.
     *
     * @param jsonContents The JSON representing the Artifact object to be saved.
     *                     The Artifact implements the Artifact interface.
     * @param workspaceId  The identifier for the destination workspace.
     * @param artifactId
     */
    Mono<? extends ArtifactImportDTO> extractArtifactExchangeJsonAndSaveArtifact(
            String jsonContents, String workspaceId, String artifactId);

    /**
     * Saves the provided ArtifactExchangeJson within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param artifactExchangeJson The JSON file representing the Artifact object to be saved.
     *                              The Artifact implements the Artifact interface.
     */
    Mono<? extends Artifact> importNewArtifactInWorkspaceFromJson(
            String workspaceId, ArtifactExchangeJson artifactExchangeJson);

    Mono<? extends Artifact> updateNonGitConnectedArtifactFromJson(
            String workspaceId, String artifactId, ArtifactExchangeJson artifactExchangeJson);

    /**
     * Updates an existing Artifact connected to Git within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param artifactId           The Artifact id that needs to be updated with the new resources.
     * @param artifactExchangeJson The Artifact JSON containing necessary information to update the Artifact.
     * @param branchName           The name of the Git branch. Set to null if not connected to Git.
     * @return The updated Artifact stored in the database.
     */
    Mono<? extends Artifact> importArtifactInWorkspaceFromGit(
            String workspaceId, String artifactId, ArtifactExchangeJson artifactExchangeJson, String branchName);

    Mono<? extends Artifact> mergeArtifactExchangeJsonWithImportableArtifact(
            String workspaceId,
            String artifactId,
            String branchName,
            ArtifactExchangeJson artifactExchangeJson,
            List<String> entitiesToImport);

    Mono<? extends Artifact> restoreSnapshot(
            String workspaceId, String branchedArtifactId, ArtifactExchangeJson artifactExchangeJson);

    Mono<? extends ArtifactImportDTO> getArtifactImportDTO(
            String workspaceId, String artifactId, Artifact importableArtifact, ArtifactType artifactType);

    Mono<List<Datasource>> findDatasourceByArtifactId(
            String workspaceId, String baseArtifactId, ArtifactType artifactType);
}
