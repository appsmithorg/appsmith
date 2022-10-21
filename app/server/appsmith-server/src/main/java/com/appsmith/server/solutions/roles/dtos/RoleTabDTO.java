package com.appsmith.server.solutions.roles.dtos;

import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
public class RoleTabDTO {
    List<PermissionViewableName> permissions;
    EntityView data;
    Map<String, Set<IdPermissionDTO>> hoverMap;
}
