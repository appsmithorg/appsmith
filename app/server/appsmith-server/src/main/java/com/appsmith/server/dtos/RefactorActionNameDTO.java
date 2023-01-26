package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefactorActionNameDTO {
    @JsonView(Views.Public.class)
    String actionId;

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    String layoutId;

    @JsonView(Views.Public.class)
    String oldName;

    @JsonView(Views.Public.class)
    String newName;

    @JsonView(Views.Public.class)
    String collectionName;
}
