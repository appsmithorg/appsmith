package com.appsmith.server.dtos.ce;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePermissionGroupCE_DTO {
    @JsonView(Views.Public.class)
    private String username;
    @JsonView(Views.Public.class)
    private String newPermissionGroupId;
}
