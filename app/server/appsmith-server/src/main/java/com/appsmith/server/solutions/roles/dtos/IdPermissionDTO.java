package com.appsmith.server.solutions.roles.dtos;

import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class IdPermissionDTO {
    String id;
    PermissionViewableName p;
}
