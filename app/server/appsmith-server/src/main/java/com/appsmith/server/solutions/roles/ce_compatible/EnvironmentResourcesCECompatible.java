package com.appsmith.server.solutions.roles.ce_compatible;

import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.EnvironmentResourceDTO;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public interface EnvironmentResourcesCECompatible {

    Mono<BaseView> getEnvironmentEntityBaseView(
            Map<String, Collection<EnvironmentResourceDTO>> workspaceEnvironmentMap, BaseView workspaceDTO);

    Mono<Boolean> getWorkspaceEnvironmentsHoverMapMono(
            RoleTab roleTab,
            Mono<Map<String, Collection<Environment>>> workspaceEnvironmentMapMono,
            Map<AclPermission, Set<AclPermission>> workspaceHierarchicalLateralMap,
            ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap,
            Flux<Workspace> workspaceFlux);

    Mono<Void> updateEnvironmentDisableMapMono(
            RoleTab roleTab,
            Flux<Environment> environmentFlux,
            ConcurrentHashMap<String, Set<IdPermissionDTO>> disableMap);
}
