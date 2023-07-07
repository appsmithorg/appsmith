package com.appsmith.server.solutions.roles.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateRoleConfigDTO {

    String tabName;

    Set<UpdateRoleEntityDTO> entitiesChanged;
}
