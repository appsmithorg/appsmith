package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class ActionCollectionUpdateDTO {

    ActionCollectionDTO actionCollection;
    ActionUpdatesDTO actions;
}
