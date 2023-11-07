package com.appsmith.server.solutions.roles;

import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.solutions.roles.ce_compatible.EnvironmentResourcesCECompatibleImpl;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.EnvironmentResourceDTO;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.WORKSPACE_DATASOURCE;
import static com.appsmith.server.constants.FieldName.WORKSPACE_ENVIRONMENT;
import static com.appsmith.server.solutions.roles.HelperUtil.generateLateralPermissionDTOsAndUpdateMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getHierarchicalLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getRoleViewPermissionDTO;
import static java.lang.Boolean.TRUE;

@Component
@RequiredArgsConstructor
public class EnvironmentResourcesImpl extends EnvironmentResourcesCECompatibleImpl implements EnvironmentResources {

    private final PolicyGenerator policyGenerator;

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Mono<BaseView> getEnvironmentEntityBaseView(
            Map<String, Collection<EnvironmentResourceDTO>> workspaceEnvironmentMap,
            BaseView workspaceDTO,
            Workspace workspace,
            String permissionGroupId) {
        // Environment View
        BaseView environmentsView = new BaseView();
        environmentsView.setId(workspace.getId());
        environmentsView.setName("Environments");
        Tuple2<List<Integer>, List<Integer>> roleViewPermissionDTO = getRoleViewPermissionDTO(
                permissionGroupId,
                Workspace.class,
                policyGenerator,
                workspace.getPolicies(),
                RoleTab.DATASOURCES_ENVIRONMENTS.getDuplicateEntities().stream()
                        .filter(tuple3 -> tuple3.getT1().equals("Environments"))
                        .findFirst()
                        .get()
                        .getT3()
                        .stream()
                        .collect(Collectors.toSet()),
                RoleTab.DATASOURCES_ENVIRONMENTS.getViewablePermissions());
        environmentsView.setEnabled(roleViewPermissionDTO.getT1());
        environmentsView.setEditable(roleViewPermissionDTO.getT2());
        EntityView environmentsEntityView = new EntityView();
        environmentsEntityView.setType(Environment.class.getSimpleName());
        List<EnvironmentResourceDTO> environmentResourceDTOS =
                (List<EnvironmentResourceDTO>) workspaceEnvironmentMap.get(workspaceDTO.getId());
        environmentsEntityView.setEntities(environmentResourceDTOS);
        environmentsView.setChildren(Set.of(environmentsEntityView));
        return Mono.just(environmentsView);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Mono<Boolean> getWorkspaceEnvironmentsHoverMapMono(
            RoleTab roleTab,
            Mono<Map<String, Collection<Environment>>> workspaceEnvironmentMapMono,
            Map<AclPermission, Set<AclPermission>> workspaceHierarchicalLateralMap,
            ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap,
            Flux<Workspace> workspaceFlux) {

        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> environmentPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Environment.class))
                .collect(Collectors.toSet());

        Map<AclPermission, Set<AclPermission>> environmentHierarchicalLateralMap =
                getHierarchicalLateralPermMap(environmentPermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMapEnvironments = new ConcurrentHashMap<>();

        return workspaceEnvironmentMapMono
                .flatMapMany(workspaceEnvironmentMap -> workspaceFlux.map(workspace -> {
                    String workspaceId = workspace.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            workspaceHierarchicalLateralMap,
                            hoverMapEnvironments,
                            workspaceId,
                            workspaceId,
                            Workspace.class);
                    Collection<Environment> environments = workspaceEnvironmentMap.get(workspace.getId());
                    if (!CollectionUtils.isEmpty(environments)) {
                        environments.stream().forEach(environment -> {
                            String environmentId = environment.getId();
                            generateLateralPermissionDTOsAndUpdateMap(
                                    workspaceHierarchicalLateralMap,
                                    hoverMapEnvironments,
                                    workspaceId,
                                    environmentId,
                                    Environment.class);
                            generateLateralPermissionDTOsAndUpdateMap(
                                    environmentHierarchicalLateralMap,
                                    hoverMapEnvironments,
                                    environmentId,
                                    environmentId,
                                    Environment.class);
                        });
                    }
                    hoverMapEnvironments.forEach((key, value) -> {
                        if (key.startsWith(workspaceId)
                                && !key.contains(WORKSPACE_DATASOURCE)
                                && !key.contains(WORKSPACE_ENVIRONMENT)) {
                            hoverMapEnvironments.remove(key);
                            hoverMapEnvironments.put(key + "_" + WORKSPACE_ENVIRONMENT, value);
                        }
                    });
                    hoverMap.putAll(hoverMapEnvironments);
                    return workspace;
                }))
                .then(Mono.just(TRUE));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Mono<Void> updateEnvironmentDisableMapMono(
            RoleTab roleTab,
            Flux<Environment> environmentFlux,
            ConcurrentHashMap<String, Set<IdPermissionDTO>> disableMap) {

        Set<AclPermission> tabPermissions = roleTab.getPermissions();
        Set<AclPermission> environmentPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Environment.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> environmentLateralMap =
                getLateralPermMap(environmentPermissions, policyGenerator, roleTab);

        return environmentFlux
                .map(environment -> {
                    String environmentId = environment.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            environmentLateralMap, disableMap, environmentId, environmentId, Environment.class);
                    return environmentId;
                })
                .then();
    }
}
