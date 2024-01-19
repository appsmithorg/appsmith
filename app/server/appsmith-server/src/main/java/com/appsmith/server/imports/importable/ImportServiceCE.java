package com.appsmith.server.imports.importable;

import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportableArtifactDTO;
import com.appsmith.server.imports.internal.ContextBasedImportService;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ImportServiceCE {

    /**
     * This method provides the importService specific to the artifact based on the ArtifactJsonType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param artifactExchangeJson : Entity Json which is implementing the artifactExchangeJson
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    ContextBasedImportService<
                    ? extends ImportableArtifact, ? extends ImportableArtifactDTO, ? extends ArtifactExchangeJson>
            getContextBasedImportService(ArtifactExchangeJson artifactExchangeJson);

    /**
     * This method provides the importService specific to the artifact based on the ArtifactJsonType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param artifactJsonType : Type of Json serialisation
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    ContextBasedImportService<
                    ? extends ImportableArtifact, ? extends ImportableArtifactDTO, ? extends ArtifactExchangeJson>
            getContextBasedImportService(ArtifactJsonType artifactJsonType);

    /**
     * This method takes a file part and makes a Json entity which implements the ArtifactExchangeJson interface
     *
     * @param filePart           : filePart from which the contents would be made
     * @param artifactJsonType : type of the dataExchangeJson
     * @return : Json entity which implements ArtifactExchangeJson
     */
    Mono<? extends ArtifactExchangeJson> extractArtifactExchangeJson(Part filePart, ArtifactJsonType artifactJsonType);

    /**
     * Hydrates an ImportableArtifact within the specified workspace by saving the provided JSON file.
     *
     * @param filePart    The filePart representing the ImportableArtifact object to be saved.
     *                    The ImportableArtifact implements the ImportableArtifact interface.
     * @param workspaceId The identifier for the destination workspace.
     * @param artifactId
     * @param  artifactJsonType
     */
    Mono<? extends ImportableArtifactDTO> extractArtifactExchangeJsonAndSaveArtifact(
            Part filePart, String workspaceId, String artifactId, ArtifactJsonType artifactJsonType);

    /**
     * Saves the provided ArtifactExchangeJson within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param artifactExchangeJson The JSON file representing the ImportableArtifact object to be saved.
     *                              The ImportableArtifact implements the ImportableArtifact interface.
     */
    Mono<? extends ImportableArtifact> importNewArtifactInWorkspaceFromJson(
            String workspaceId, ArtifactExchangeJson artifactExchangeJson);

    Mono<? extends ImportableArtifact> updateNonGitConnectedArtifactFromJson(
            String workspaceId, String artifactId, ArtifactExchangeJson artifactExchangeJson);

    /**
     * Updates an existing ImportableArtifact connected to Git within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param artifactId           The ImportableArtifact id that needs to be updated with the new resources.
     * @param artifactExchangeJson The ImportableArtifact JSON containing necessary information to update the ImportableArtifact.
     * @param branchName           The name of the Git branch. Set to null if not connected to Git.
     * @return The updated ImportableArtifact stored in the database.
     */
    Mono<? extends ImportableArtifact> importArtifactInWorkspaceFromGit(
            String workspaceId, String artifactId, ArtifactExchangeJson artifactExchangeJson, String branchName);

    Mono<? extends ImportableArtifact> mergeArtifactExchangeJsonWithImportableArtifact(
            String workspaceId,
            String artifactId,
            String branchName,
            ArtifactExchangeJson artifactExchangeJson,
            List<String> entitiesToImport);

    Mono<? extends ImportableArtifact> restoreSnapshot(
            String workspaceId, ArtifactExchangeJson artifactExchangeJson, String artifactId, String branchName);

    Mono<? extends ImportableArtifactDTO> getArtifactImportDTO(
            String workspaceId,
            String artifactId,
            ImportableArtifact importableArtifact,
            ArtifactExchangeJson artifactExchangeJson);
}
