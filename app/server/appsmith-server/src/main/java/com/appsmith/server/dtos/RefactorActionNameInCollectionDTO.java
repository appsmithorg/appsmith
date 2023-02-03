package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefactorActionNameInCollectionDTO {
    @JsonView(Views.Public.class)
    RefactorActionNameDTO refactorAction;

    @JsonView(Views.Public.class)
    ActionCollectionDTO actionCollection;
}
