package com.appsmith.server.solutions.roles;

import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import reactor.core.publisher.Mono;

public interface RoleConfigurationView {

    Mono<RoleViewDTO> getAllTabViews(String permissionGroupId);

}