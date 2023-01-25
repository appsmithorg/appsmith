package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode
public class PermissionGroupInfoDTO {
    @JsonView(Views.Api.class)
    private String id;

    @JsonView(Views.Api.class)
    private String name;
    
    @JsonView(Views.Api.class)
    private String description;

}
