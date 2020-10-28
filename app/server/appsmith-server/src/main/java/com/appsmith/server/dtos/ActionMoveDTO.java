package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter
@Setter
public class ActionMoveDTO {

    @NotNull
    ActionDTO action;

    @NotNull
    String destinationPageId;
}
