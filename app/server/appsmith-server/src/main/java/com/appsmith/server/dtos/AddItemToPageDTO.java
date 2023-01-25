package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AddItemToPageDTO {
    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String pageId;

    @JsonView(Views.Api.class)
    String workspaceId;

    @JsonView(Views.Api.class)
    ItemDTO marketplaceElement;
}
