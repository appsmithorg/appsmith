package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class ActionMoveDTO {

    @NotNull
    ActionDTO action;

    @NotNull
    String destinationPageId;
}
