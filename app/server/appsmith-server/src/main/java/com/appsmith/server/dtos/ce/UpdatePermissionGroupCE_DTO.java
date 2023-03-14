package com.appsmith.server.dtos.ce;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePermissionGroupCE_DTO {
    private String username;
    private String newPermissionGroupId;
}
