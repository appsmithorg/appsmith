package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefactorActionCollectionNameDTO {
    @JsonView(Views.Public.class)
    String actionCollectionId;

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    String layoutId;

    @JsonView(Views.Public.class)
    String oldName;

    @JsonView(Views.Public.class)
    String newName;
}
