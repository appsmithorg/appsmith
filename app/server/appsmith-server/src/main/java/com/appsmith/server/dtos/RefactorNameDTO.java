package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefactorNameDTO {
    @JsonView(Views.Api.class)
    String pageId;

    @JsonView(Views.Api.class)
    String layoutId;

    @JsonView(Views.Api.class)
    String oldName;

    @JsonView(Views.Api.class)
    String newName;
}
