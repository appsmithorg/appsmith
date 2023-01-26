package com.appsmith.server.dtos;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ItemDTO {
    @JsonView(Views.Public.class)
    ItemType type;

    @JsonView(Views.Public.class)
    ApiTemplate item;
}
