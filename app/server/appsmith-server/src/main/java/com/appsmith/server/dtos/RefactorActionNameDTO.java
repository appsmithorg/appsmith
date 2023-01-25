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
    @JsonView(Views.Api.class)
    String actionId;

    @JsonView(Views.Api.class)
    String pageId;

    @JsonView(Views.Api.class)
    String layoutId;

    @JsonView(Views.Api.class)
    String oldName;

    @JsonView(Views.Api.class)
    String newName;

    @JsonView(Views.Api.class)
    String collectionName;
}
