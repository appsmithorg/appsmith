package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefactorActionNameInCollectionDTO {
    @JsonView(Views.Api.class)
    RefactorActionNameDTO refactorAction;

    @JsonView(Views.Api.class)
    ActionCollectionDTO actionCollection;
}
