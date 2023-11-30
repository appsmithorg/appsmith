package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.RefactorEntityNameCE_DTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefactorEntityNameDTO extends RefactorEntityNameCE_DTO {
    String moduleId;
    String moduleInstanceId;

    public RefactorEntityNameDTO(
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
            String moduleId,
            String moduleInstanceId,
            Boolean isInternal) {
        super(
                pageId,
                layoutId,
                oldName,
                newName,
                entityType,
                actionId,
                actionCollectionId,
                collectionName,
                actionCollection,
                oldFullyQualifiedName,
                newFullyQualifiedName,
                isInternal);
        this.moduleId = moduleId;
        this.moduleInstanceId = moduleInstanceId;
    }
}
