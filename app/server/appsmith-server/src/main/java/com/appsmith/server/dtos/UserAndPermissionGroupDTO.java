package com.appsmith.server.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserAndPermissionGroupDTO {

    String userId;

    String username;

    String name;

    String permissionGroupName;

    String permissionGroupId;

}
