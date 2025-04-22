package com.appsmith.server.refactors;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ce.LayoutContainer;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Service interface for handling layout-related refactoring operations within a context
 * such as a page or module. It provides methods to retrieve, update, and evaluate layouts
 * while preserving consistency during entity renaming or structural changes.
 *
 * @param <U> The domain type associated with the context (e.g., Page, Module)
 * @param <T> The layout container type that holds layouts (e.g., PageDTO, ModuleDTO)
 */
public interface ContextLayoutRefactoringService<U extends BaseDomain, T extends LayoutContainer> {

    /**
     * Updates the context identified by the given contextId with the provided layout container.
     *
     * @param contextId The unique identifier of the context to update
     * @param dto The layout container containing updated layout information
     * @return A Mono emitting the updated layout container
     */
    Mono<T> updateContext(String contextId, LayoutContainer dto);

    /**
     * Retrieves the layout container (DTO) for the given contextId and view mode.
     *
     * @param contextId The unique identifier of the context
     * @param viewMode true for published version, false for unpublished
     * @return A Mono emitting the requested layout container
     */
    Mono<T> getContextDTOMono(String contextId, boolean viewMode);

    /**
     * Retrieves the layout container using metadata derived from the refactoring context.
     *
     * @param refactoringMetaDTO Metadata describing the refactoring context
     * @return A Mono emitting the corresponding layout container
     */
    Mono<T> getContextDTOMono(RefactoringMetaDTO refactoringMetaDTO);

    /**
     * Retrieves the evaluation version associated with the context, used to guide DSL parsing or upgrades.
     *
     * @param contextId The unique identifier of the context
     * @param refactorEntityNameDTO DTO containing the old and new entity names
     * @param refactoringMetaDTO Metadata describing the refactoring context
     * @return A Mono emitting the evaluation version for the context
     */
    Mono<Integer> getEvaluationVersionMono(
            String contextId, RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO);

    /**
     * Retrieves the evaluation version for the context without refactor-specific inputs.
     *
     * @param artifactId The unique identifier of the artifact
     * @return A Mono emitting the evaluation version
     */
    Mono<Integer> getEvaluationVersionMono(String artifactId);

    /**
     * Extracts layouts from the provided refactoring metadata.
     *
     * @param refactoringMetaDTO Metadata describing the refactoring context
     * @return A list of layouts associated with the context
     */
    List<Layout> getLayouts(RefactoringMetaDTO refactoringMetaDTO);

    /**
     * Updates a specific layout for the context identified by contextId.
     *
     * @param contextId The unique identifier of the context
     * @param layout The layout to update
     * @return A Mono emitting the updated layout container
     */
    Mono<T> updateLayoutByContextId(String contextId, Layout layout);

    /**
     * Retrieves the context ID from the provided refactoring metadata.
     *
     * @param refactoringMetaDTO Metadata describing the refactoring context
     * @return The unique context identifier
     */
    String getId(RefactoringMetaDTO refactoringMetaDTO);

    /**
     * Retrieves the artifact ID from the provided refactoring metadata.
     *
     * @param refactoringMetaDTO Metadata describing the refactoring context
     * @return The artifact identifier associated with the context
     */
    String getArtifactId(RefactoringMetaDTO refactoringMetaDTO);

    /**
     * Updates the in-memory copy of the refactored context in the given metadata object.
     *
     * @param refactoringMetaDTO Metadata describing the refactoring context
     * @param updatedContext The updated layout container to persist in metadata
     */
    void setUpdatedContext(RefactoringMetaDTO refactoringMetaDTO, LayoutContainer updatedContext);
}
