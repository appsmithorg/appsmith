package com.appsmith.server.dtos;

import com.appsmith.server.domains.Action;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter
@Setter
public class ActionMoveDTO {
    @NotNull
    Action action;

    @NotNull
    String destinationPageId;
}
