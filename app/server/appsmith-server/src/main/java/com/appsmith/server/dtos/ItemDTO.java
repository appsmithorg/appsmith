package com.appsmith.server.dtos;

import com.appsmith.external.models.ApiTemplate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ItemDTO {
    ItemType type;
    ApiTemplate item;
}
