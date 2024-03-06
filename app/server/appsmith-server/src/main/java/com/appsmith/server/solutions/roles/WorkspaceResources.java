package com.appsmith.server.solutions.roles;

import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import reactor.core.publisher.Mono;

public interface WorkspaceResources {
    Mono<RoleTabDTO> createApplicationResourcesTabView(
            String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs);

    Mono<RoleTabDTO> createDatasourceResourcesTabView(
            String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs);

    CommonAppsmithObjectData getDataFromRepositoryForAllTabs();
}
