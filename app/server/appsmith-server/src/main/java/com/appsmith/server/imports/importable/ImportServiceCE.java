package com.appsmith.server.imports.importable;

import com.appsmith.server.constants.ImportableJsonType;
import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.imports.internal.ContextBasedImportService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

public interface ImportServiceCE {

    /**
     * This method provides the importService specific to context based on the ImportableJsonType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param importableContextJson : Entity Json which is implementing the importableContextJson
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableContextJson importableContextJson);

    ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableJsonType importableJsonType);

    ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(MediaType contentType);

    /**
     * This method takes a file part and makes a Json entity which implements the ImportableContextJson inteface
     * @param filePart : filePart from which the contents would be made
     * @return : Json entity which implements ImportableContextJson
     */
    Mono<? extends ImportableContextJson> extractImportableContextJson(Part filePart);

    /**
     * Hydrates an ImportableContext within the specified workspace by saving the provided JSON file.
     *
     * @param workspaceId The identifier for the destination workspace.
     * @param filePart    The filePart representing the ImportableContext object to be saved.
     *                    The ImportableContext implements the ImportableContext interface.
     */
    Mono<? extends ImportableContextDTO> extractAndSaveContext(String workspaceId, Part filePart, String contextId);

    /**
     * Saves the provided ImportableContextJson within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param contextJson The JSON file representing the ImportableContext object to be saved.
     *                              The ImportableContext implements the ImportableContext interface.
     */
    Mono<? extends ImportableContext> importNewContextInWorkspaceFromJson(
            String workspaceId, ImportableContextJson contextJson);

    Mono<? extends ImportableContext> updateNonGitConnectedContextFromJson(
            String workspaceId, String contextId, ImportableContextJson importableContextJson);

    /**
     * Updates an existing ImportableContext connected to Git within the specified workspace.
     *
     * @param workspaceId   The identifier for the destination workspace.
     * @param importableContextJson   The ImportableContext JSON containing necessary information to update the ImportableContext.
     * @param contextId The ImportableContext id that needs to be updated with the new resources.
     * @param branchName    The name of the Git branch. Set to null if not connected to Git.
     * @return The updated ImportableContext stored in the database.
     */
    Mono<? extends ImportableContext> importContextInWorkspaceFromGit(
            String workspaceId, String contextId, ImportableContextJson importableContextJson, String branchName);

    Mono<? extends ImportableContextDTO> getContextImportDTO(
            String workspaceId,
            String contextId,
            ImportableContext importableContext,
            ImportableContextJson importableContextJson);
}
