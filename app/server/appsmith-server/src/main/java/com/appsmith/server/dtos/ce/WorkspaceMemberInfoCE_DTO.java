package com.appsmith.server.dtos.ce;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WorkspaceMemberInfoCE_DTO {
    @JsonView(Views.Api.class)
    String userId;
    @JsonView(Views.Api.class)
    String username;
    @JsonView(Views.Api.class)
    String name;
    @JsonView(Views.Api.class)
    String permissionGroupName;
    @JsonView(Views.Api.class)
    String permissionGroupId;
}
