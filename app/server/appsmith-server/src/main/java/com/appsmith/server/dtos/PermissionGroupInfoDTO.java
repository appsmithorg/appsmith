package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode
public class PermissionGroupInfoDTO {
    @JsonView(Views.Public.class)
    private String id;

    @JsonView(Views.Public.class)
    private String name;
    
    @JsonView(Views.Public.class)
    private String description;

}
