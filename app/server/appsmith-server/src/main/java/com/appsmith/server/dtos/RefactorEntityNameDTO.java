package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefactorEntityNameDTO {
    String pageId;
    String layoutId;
    String oldName;
    String newName;

    EntityType entityType;

    String actionId;
    String actionCollectionId;
    String collectionName;

    String oldFullyQualifiedName;
    String newFullyQualifiedName;
    boolean isFQN;
}
