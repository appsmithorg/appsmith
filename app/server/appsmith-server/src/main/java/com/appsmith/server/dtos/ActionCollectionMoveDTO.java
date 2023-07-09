package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActionCollectionMoveDTO {

    @NotNull String name;

    @NotNull String collectionId;

    @NotNull String destinationPageId;
}
