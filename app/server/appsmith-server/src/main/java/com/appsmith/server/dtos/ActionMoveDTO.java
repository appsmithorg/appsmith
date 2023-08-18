package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActionMoveDTO {

    @NotNull ActionDTO action;

    @NotNull String destinationPageId;
}
