package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class ActionMoveDTO {

    @NotNull
    @JsonView(Views.Public.class)
    ActionDTO action;

    @NotNull
    @JsonView(Views.Public.class)
    String destinationPageId;
}
