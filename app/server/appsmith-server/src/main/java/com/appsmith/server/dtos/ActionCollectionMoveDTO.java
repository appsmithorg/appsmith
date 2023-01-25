package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class ActionCollectionMoveDTO {

    @NotNull
    @JsonView(Views.Api.class)
    String name;

    @NotNull
    @JsonView(Views.Api.class)
    String collectionId;

    @NotNull
    @JsonView(Views.Api.class)
    String destinationPageId;
}
