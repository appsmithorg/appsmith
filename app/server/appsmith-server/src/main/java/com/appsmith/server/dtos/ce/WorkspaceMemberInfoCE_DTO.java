package com.appsmith.server.dtos.ce;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WorkspaceMemberInfoCE_DTO {
    @JsonView(Views.Public.class)
    String userId;
    @JsonView(Views.Public.class)
    String username;
    @JsonView(Views.Public.class)
    String name;
    @JsonView(Views.Public.class)
    String permissionGroupName;
    @JsonView(Views.Public.class)
    String permissionGroupId;
}
