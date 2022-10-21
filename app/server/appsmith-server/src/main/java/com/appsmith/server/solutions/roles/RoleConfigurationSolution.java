package com.appsmith.server.solutions.roles;

import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import reactor.core.publisher.Mono;

public interface RoleConfigurationSolution {

    Mono<RoleViewDTO> getAllTabViews(String permissionGroupId);

    Mono<RoleViewDTO> updateRoles(String permissionGroupId, UpdateRoleConfigDTO updateRoleConfigDTO);
}