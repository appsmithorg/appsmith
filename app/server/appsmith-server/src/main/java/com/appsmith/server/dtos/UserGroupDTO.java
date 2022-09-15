package com.appsmith.server.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class UserGroupDTO {

    String id;

    String name;

    String description;

    String tenantId;

    List<UserCompactDTO> users = new ArrayList<>();

    List<PermissionGroupInfoDTO> roles = new ArrayList<>();

}
