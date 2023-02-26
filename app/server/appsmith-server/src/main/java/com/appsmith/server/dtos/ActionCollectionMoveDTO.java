package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class ActionCollectionMoveDTO {

    @NotNull
    String name;

    @NotNull
    String collectionId;

    @NotNull
    String destinationPageId;
}
