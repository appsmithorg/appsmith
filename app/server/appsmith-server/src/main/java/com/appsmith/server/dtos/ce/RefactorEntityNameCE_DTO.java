package com.appsmith.server.dtos.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
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
    String collectionName;
    ActionCollectionDTO actionCollection;

    @JsonView(Views.Internal.class)
    String oldFullyQualifiedName;

    @JsonView(Views.Internal.class)
    String newFullyQualifiedName;

    @JsonView(Views.Internal.class)
    Boolean isInternal;

    CreatorContextType contextType;
}
