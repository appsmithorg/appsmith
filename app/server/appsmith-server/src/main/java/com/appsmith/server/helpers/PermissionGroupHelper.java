package com.appsmith.server.helpers;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PermissionGroupHelper {
    Mono<Boolean> isAutoCreated(PermissionGroup permissionGroup);

    Flux<PermissionGroupInfoDTO> mapToPermissionGroupInfoDto(Flux<PermissionGroup> permissionGroupFlux);

    Mono<String> getDefaultRoleForAllUserRoleId();

    boolean isUserManagementRole(PermissionGroup role);
}
