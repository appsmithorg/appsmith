package com.appsmith.server.dtos.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefactorEntityNameCE_DTO {
    String pageId;
    String layoutId;
    String oldName;
    String newName;

    @JsonView(Views.Internal.class)
    EntityType entityType;

    String actionId;
    String actionCollectionId;
    String collectionName;
    ActionCollectionDTO actionCollection;

    @JsonView(Views.Internal.class)
    String oldFullyQualifiedName;

    @JsonView(Views.Internal.class)
    String newFullyQualifiedName;
}
