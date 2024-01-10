package com.appsmith.server.imports.importable;

import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.imports.internal.ContextBasedImportService;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

public interface ArtifactImportServiceCE {

    /**
     * This method provides the importService specific to context based on the ArtifactJsonType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param importableContextJson : Entity Json which is implementing the importableContextJson
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    ContextBasedImportService<
                    ? extends ImportableArtifact, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableContextJson importableContextJson);

    /**
     * This method provides the importService specific to context based on the ArtifactJsonType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param artifactJsonType : Type of Json serialisation
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    ContextBasedImportService<
                    ? extends ImportableArtifact, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ArtifactJsonType artifactJsonType);

    /**
     * This method takes a file part and makes a Json entity which implements the ImportableContextJson interface
     *
     * @param filePart           : filePart from which the contents would be made
     * @param artifactJsonType : type of the dataExchangeJson
     * @return : Json entity which implements ImportableContextJson
     */
    Mono<? extends ImportableContextJson> extractImportableContextJson(
            Part filePart, ArtifactJsonType artifactJsonType);

    /**
     * Hydrates an ImportableArtifact within the specified workspace by saving the provided JSON file.
     *
     * @param filePart    The filePart representing the ImportableArtifact object to be saved.
     *                    The ImportableArtifact implements the ImportableArtifact interface.
     * @param workspaceId The identifier for the destination workspace.
     */
    Mono<? extends ImportableContextDTO> extractAndSaveContext(
            Part filePart, String workspaceId, String contextId, ArtifactJsonType artifactJsonType);

    /**
     * Saves the provided ImportableContextJson within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param contextJson The JSON file representing the ImportableArtifact object to be saved.
     *                              The ImportableArtifact implements the ImportableArtifact interface.
     */
    Mono<? extends ImportableArtifact> importNewContextInWorkspaceFromJson(
            String workspaceId, ImportableContextJson contextJson);

    Mono<? extends ImportableArtifact> updateNonGitConnectedContextFromJson(
            String workspaceId, String contextId, ImportableContextJson importableContextJson);

    /**
     * Updates an existing ImportableArtifact connected to Git within the specified workspace.
     *
     * @param workspaceId   The identifier for the destination workspace.
     * @param importableContextJson   The ImportableArtifact JSON containing necessary information to update the ImportableArtifact.
     * @param contextId The ImportableArtifact id that needs to be updated with the new resources.
     * @param branchName    The name of the Git branch. Set to null if not connected to Git.
     * @return The updated ImportableArtifact stored in the database.
     */
    Mono<? extends ImportableArtifact> importContextInWorkspaceFromGit(
            String workspaceId, String contextId, ImportableContextJson importableContextJson, String branchName);

    Mono<? extends ImportableContextDTO> getContextImportDTO(
            String workspaceId,
            String contextId,
            ImportableArtifact importableContext,
            ImportableContextJson importableContextJson);
}
