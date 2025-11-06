package com.appsmith.server.dtos.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefactorEntityNameCE_DTO {
    String pageId;
    String layoutId;
    String oldName;
    String newName;

    @JsonView(Views.Internal.class)
    EntityType entityType;

    String actionId;
    String actionCollectionId;

    public RefactorEntityNameCE_DTO(
            String pageId,
            String layoutId,
            String oldName,
            String newName,
            EntityType entityType,
            String actionId,
            String actionCollectionId,
            String collectionName,
            ActionCollectionDTO actionCollection,
            String oldFullyQualifiedName,
            String newFullyQualifiedName,
            Boolean isInternal,
            CreatorContextType contextType) {
        this.pageId = pageId;
        this.layoutId = layoutId;
        this.oldName = oldName;
        this.newName = newName;
        this.entityType = entityType;
        this.actionId = actionId;
        this.actionCollectionId = actionCollectionId;
        this.collectionName = collectionName;
        this.actionCollection = actionCollection;
        this.oldFullyQualifiedName = oldFullyQualifiedName;
        this.newFullyQualifiedName = newFullyQualifiedName;
        this.isInternal = isInternal;
        this.contextType = contextType;
    }

    String collectionName;
    ActionCollectionDTO actionCollection;

    @JsonView(Views.Internal.class)
    String oldFullyQualifiedName;

    @JsonView(Views.Internal.class)
    String newFullyQualifiedName;

    @JsonView(Views.Internal.class)
    Boolean isInternal;

    CreatorContextType contextType;

    // Cache fields for optimization - storing objects directly
    @JsonView(Views.Internal.class)
    private PageDTO cachedPageDTO;

    @JsonView(Views.Internal.class)
    private Integer cachedEvaluationVersion;

    @JsonView(Views.Internal.class)
    private String cachedApplicationId;

    // Helper methods for cache management
    public boolean hasCachedPageDTO() {
        return cachedPageDTO != null;
    }

    public boolean hasCachedEvaluationVersion() {
        return cachedEvaluationVersion != null;
    }

    public boolean hasCachedApplicationId() {
        return cachedApplicationId != null;
    }

    public RefactorEntityNameCE_DTO withCachedPageDTO(PageDTO pageDTO) {
        this.cachedPageDTO = pageDTO;
        this.cachedApplicationId = pageDTO.getApplicationId(); // Auto-populate applicationId
        return this;
    }

    public RefactorEntityNameCE_DTO withCachedEvaluationVersion(Integer evaluationVersion) {
        this.cachedEvaluationVersion = evaluationVersion;
        return this;
    }
}
