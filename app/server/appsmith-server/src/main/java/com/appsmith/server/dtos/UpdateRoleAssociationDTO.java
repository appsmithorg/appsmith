package com.appsmith.server.dtos;

import lombok.Data;

import java.util.Set;

@Data
public class UpdateRoleAssociationDTO {

    Set<UserCompactDTO> users;

    Set<UserGroupCompactDTO> groups;

    Set<PermissionGroupCompactDTO> rolesAdded;

    Set<PermissionGroupCompactDTO> rolesRemoved;

}
