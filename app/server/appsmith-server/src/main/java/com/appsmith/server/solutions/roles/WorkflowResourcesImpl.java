package com.appsmith.server.solutions.roles;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.solutions.roles.ce_compatible.WorkflowResourcesCECompatibleImpl;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.ActionCollectionResourceDTO;
import com.appsmith.server.solutions.roles.dtos.ActionResourceDTO;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import com.appsmith.server.solutions.roles.dtos.WorkflowResourceDTO;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.appsmith.server.solutions.roles.HelperUtil.generateBaseViewDto;
import static com.appsmith.server.solutions.roles.HelperUtil.generateLateralPermissionDTOsAndUpdateMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getHierarchicalLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getRoleViewPermissionDTO;
import static com.appsmith.server.solutions.roles.constants.RoleTab.WORKFLOWS;

@Component
public class WorkflowResourcesImpl extends WorkflowResourcesCECompatibleImpl implements WorkflowResources {

    private final PolicyGenerator policyGenerator;

    public WorkflowResourcesImpl(PolicyGenerator policyGenerator) {
        this.policyGenerator = policyGenerator;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<RoleTabDTO> getWorkflowTabInfo(
            String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs) {
        return createWorkflowResourceTabView(permissionGroupId, dataFromRepositoryForAllTabs);
    }

    private Mono<RoleTabDTO> createWorkflowResourceTabView(
            String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs) {
        Flux<Workspace> workspaceFlux = dataFromRepositoryForAllTabs.getWorkspaceFlux();
        Flux<Workflow> workflowFlux = dataFromRepositoryForAllTabs.getWorkflowFlux();
        Mono<Map<String, Collection<Workflow>>> workspaceWorkflowMapMono =
                dataFromRepositoryForAllTabs.getWorkspaceWorkflowMapMono();
        Mono<Map<String, Collection<NewAction>>> workflowActionMapMono =
                dataFromRepositoryForAllTabs.getWorkflowActionMapMono();
        Mono<Map<String, Collection<ActionCollection>>> workflowActionCollectionMapMono =
                dataFromRepositoryForAllTabs.workflowActionCollectionMapMono;
        Mono<Map<String, Set<IdPermissionDTO>>> hoverPermissionMapForWorkflowResourcesMono =
                getHoverPermissionMapForWorkflowResources(
                        workspaceFlux,
                        workspaceWorkflowMapMono,
                        workflowActionMapMono,
                        workflowActionCollectionMapMono);
        Mono<Map<String, Set<IdPermissionDTO>>> disablePermissionMapForWorkflowResourcesMono =
                getDisablePermissionMapForWorkflowResources(
                        workspaceFlux, workflowFlux, workflowActionMapMono, workflowActionCollectionMapMono);

        Mono<EntityView> entityViewMono = Mono.zip(
                        workspaceWorkflowMapMono, workflowActionMapMono, workflowActionCollectionMapMono)
                .flatMap(pair -> {
                    Map<String, Collection<Workflow>> workspaceWorkflowMap = pair.getT1();
                    Map<String, Collection<NewAction>> workflowActionMap = pair.getT2();
                    Map<String, Collection<ActionCollection>> workflowActionCollectionMap = pair.getT3();
                    return getWorkspaceDTOsForWorkflowResources(
                                    permissionGroupId,
                                    workspaceFlux,
                                    workspaceWorkflowMap,
                                    workflowActionMap,
                                    workflowActionCollectionMap)
                            .collectList()
                            .map(workspaceDTOs -> {
                                EntityView entityView = new EntityView();
                                entityView.setType(Workspace.class.getSimpleName());
                                entityView.setEntities(workspaceDTOs);
                                return entityView;
                            });
                });

        return Mono.zip(
                        entityViewMono,
                        hoverPermissionMapForWorkflowResourcesMono,
                        disablePermissionMapForWorkflowResourcesMono)
                .map(tuple -> {
                    EntityView entityView = tuple.getT1();
                    Map<String, Set<IdPermissionDTO>> linkedPermissions = tuple.getT2();
                    Map<String, Set<IdPermissionDTO>> disableMap = tuple.getT3();
                    RoleTabDTO roleTabDTO = new RoleTabDTO();
                    roleTabDTO.setData(entityView);
                    roleTabDTO.setPermissions(WORKFLOWS.getViewablePermissions());
                    roleTabDTO.setHoverMap(linkedPermissions);
                    roleTabDTO.setDisableHelperMap(disableMap);
                    return roleTabDTO;
                });
    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getHoverPermissionMapForWorkflowResources(
            Flux<Workspace> workspaceFlux,
            Mono<Map<String, Collection<Workflow>>> workspaceWorkflowMapMono,
            Mono<Map<String, Collection<NewAction>>> workflowActionMapMono,
            Mono<Map<String, Collection<ActionCollection>>> workflowActionCollectionMapMono) {
        RoleTab roleTab = WORKFLOWS;
        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> workspacePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Workspace.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workspaceHierarchicalLateralMap =
                getHierarchicalLateralPermMap(workspacePermissions, policyGenerator, roleTab);

        Set<AclPermission> workflowPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Workflow.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workflowHierarchicalLateralMap =
                getHierarchicalLateralPermMap(workflowPermissions, policyGenerator, roleTab);

        Set<AclPermission> actionPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Action.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> actionHierarchicalLateralMap =
                getHierarchicalLateralPermMap(actionPermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap = new ConcurrentHashMap<>();

        return Mono.zip(workspaceWorkflowMapMono, workflowActionMapMono, workflowActionCollectionMapMono)
                .flatMap(pair -> {
                    Map<String, Collection<Workflow>> workspaceWorkflowMap = pair.getT1();
                    Map<String, Collection<NewAction>> workflowActionMap = pair.getT2();
                    Map<String, Collection<ActionCollection>> workflowActionCollectionMap = pair.getT3();
                    return workspaceFlux
                            .map(workspace -> {
                                String workspaceId = workspace.getId();

                                generateLateralPermissionDTOsAndUpdateMap(
                                        workspaceHierarchicalLateralMap,
                                        hoverMap,
                                        workspaceId,
                                        workspaceId,
                                        Workspace.class);
                                Collection<Workflow> workflows = workspaceWorkflowMap.get(workspaceId);
                                if (!CollectionUtils.isEmpty(workflows)) {
                                    workflows.forEach(workflow -> {
                                        String workflowId = workflow.getId();

                                        generateLateralPermissionDTOsAndUpdateMap(
                                                workspaceHierarchicalLateralMap,
                                                hoverMap,
                                                workspaceId,
                                                workflowId,
                                                Workflow.class);

                                        generateLateralPermissionDTOsAndUpdateMap(
                                                workflowHierarchicalLateralMap,
                                                hoverMap,
                                                workflowId,
                                                workflowId,
                                                Workflow.class);
                                        Collection<NewAction> actions = workflowActionMap.get(workflowId);
                                        if (!CollectionUtils.isEmpty(actions)) {
                                            actions.forEach(action -> {
                                                String actionId = action.getId();

                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        workflowHierarchicalLateralMap,
                                                        hoverMap,
                                                        workflowId,
                                                        actionId,
                                                        Action.class);

                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        actionHierarchicalLateralMap,
                                                        hoverMap,
                                                        actionId,
                                                        actionId,
                                                        Action.class);
                                            });
                                        }

                                        Collection<ActionCollection> actionCollections =
                                                workflowActionCollectionMap.get(workflowId);
                                        if (!CollectionUtils.isEmpty(actionCollections)) {
                                            actionCollections.forEach(actionCollection -> {
                                                String actionCollectionId = actionCollection.getId();

                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        workflowHierarchicalLateralMap,
                                                        hoverMap,
                                                        workflowId,
                                                        actionCollectionId,
                                                        Action.class);

                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        actionHierarchicalLateralMap,
                                                        hoverMap,
                                                        actionCollectionId,
                                                        actionCollectionId,
                                                        Action.class);
                                            });
                                        }
                                    });
                                }
                                return workspace;
                            })
                            .then(Mono.just(hoverMap));
                })
                .map(hoverMap1 -> {
                    hoverMap1.values().removeIf(Set::isEmpty);
                    return hoverMap1;
                });
    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getDisablePermissionMapForWorkflowResources(
            Flux<Workspace> workspaceFlux,
            Flux<Workflow> workflowFlux,
            Mono<Map<String, Collection<NewAction>>> workflowActionMapMono,
            Mono<Map<String, Collection<ActionCollection>>> workflowActionCollectionMapMono) {
        RoleTab roleTab = WORKFLOWS;
        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> workspacePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Workspace.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workspaceLateralMap =
                getLateralPermMap(workspacePermissions, policyGenerator, roleTab);

        Set<AclPermission> workflowPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Workflow.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workflowLateralMap =
                getLateralPermMap(workflowPermissions, policyGenerator, roleTab);

        Set<AclPermission> actionPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Action.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> actionLateralMap =
                getLateralPermMap(actionPermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> disableMap = new ConcurrentHashMap<>();

        Mono<Void> updateWorkspaceDisableMapMono = workspaceFlux
                .mapNotNull(workspace -> {
                    String workspaceId = workspace.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            workspaceLateralMap, disableMap, workspaceId, workspaceId, Workspace.class);
                    return workspaceId;
                })
                .then();

        Mono<Void> updateWorkflowDisableMapMono = workflowFlux
                .mapNotNull(workflow -> {
                    String workflowId = workflow.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            workflowLateralMap, disableMap, workflowId, workflowId, Workflow.class);
                    return workflowId;
                })
                .then();

        Mono<Void> updateActionDisableMapMono = workflowActionMapMono
                .mapNotNull(workflowActionMap -> {
                    workflowActionMap.forEach((workflowId, actions) -> {
                        actions.forEach(action -> {
                            String actionId = action.getId();
                            generateLateralPermissionDTOsAndUpdateMap(
                                    actionLateralMap, disableMap, actionId, actionId, Action.class);
                        });
                    });
                    return workflowActionMap;
                })
                .then();

        Mono<Void> updateActionCollectionDisableMapMono = workflowActionCollectionMapMono
                .mapNotNull(workflowActionMap -> {
                    workflowActionMap.forEach((workflowId, actionCollections) -> {
                        actionCollections.forEach(actionCollection -> {
                            String actionCollectionId = actionCollection.getId();
                            generateLateralPermissionDTOsAndUpdateMap(
                                    actionLateralMap, disableMap, actionCollectionId, actionCollectionId, Action.class);
                        });
                    });
                    return workflowActionMap;
                })
                .then();

        return Mono.when(
                        updateWorkspaceDisableMapMono,
                        updateWorkflowDisableMapMono,
                        updateActionDisableMapMono,
                        updateActionCollectionDisableMapMono)
                .then(Mono.just(disableMap))
                .map(disableMap1 -> {
                    disableMap1.values().removeIf(Set::isEmpty);
                    return disableMap1;
                });
    }

    private Flux<BaseView> getWorkspaceDTOsForWorkflowResources(
            String permissionGroupId,
            Flux<Workspace> workspaceFlux,
            Map<String, Collection<Workflow>> workspaceWorkflowMap,
            Map<String, Collection<NewAction>> workflowActionMap,
            Map<String, Collection<ActionCollection>> workflowActionCollectionMap) {
        return workspaceFlux
                .map(workspace -> generateBaseViewDto(
                        workspace, Workspace.class, workspace.getName(), WORKFLOWS, permissionGroupId, policyGenerator))
                .flatMap(workspaceDTO -> {
                    Collection<Workflow> workflows = workspaceWorkflowMap.get(workspaceDTO.getId());

                    Mono<List<WorkflowResourceDTO>> workflowDTOsMono = Mono.just(List.of());

                    if (!CollectionUtils.isEmpty(workflows)) {
                        workflowDTOsMono = getWorkflowDTOs(
                                        permissionGroupId, workflows, workflowActionMap, workflowActionCollectionMap)
                                .collectList();
                    }

                    return workflowDTOsMono.map(workflowDTOs -> {
                        EntityView workflowsEntity = new EntityView();
                        workflowsEntity.setType(Workflow.class.getSimpleName());
                        workflowsEntity.setEntities(workflowDTOs);
                        workspaceDTO.setChildren(Set.of(workflowsEntity));
                        return workspaceDTO;
                    });
                });
    }

    private Flux<WorkflowResourceDTO> getWorkflowDTOs(
            String permissionGroupId,
            Collection<Workflow> workflows,
            Map<String, Collection<NewAction>> workflowActionMap,
            Map<String, Collection<ActionCollection>> workflowActionCollectionMap) {
        return Flux.fromIterable(workflows).map(workflow -> {
            WorkflowResourceDTO workflowDTO = new WorkflowResourceDTO();
            workflowDTO.setId(workflow.getId());
            workflowDTO.setName(workflow.getName());
            workflowDTO.setChildren(new HashSet<>());
            Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                    WORKFLOWS, permissionGroupId, workflow.getPolicies(), Workflow.class, policyGenerator);
            workflowDTO.setEnabled(permissionsTuple.getT1());
            workflowDTO.setEditable(permissionsTuple.getT2());
            Collection<ActionResourceDTO> actionDTOs =
                    getActionDTOs(permissionGroupId, workflowActionMap.get(workflow.getId()));
            Collection<ActionCollectionResourceDTO> actionCollectionDTOs = getActionCollectionDTOs(
                    permissionGroupId, workflow, workflowActionCollectionMap.get(workflow.getId()));
            if (!CollectionUtils.isEmpty(actionDTOs)) {
                EntityView actionResourceEntityView = new EntityView();
                actionResourceEntityView.setType(NewAction.class.getSimpleName());
                actionResourceEntityView.setEntities((List) actionDTOs);
                workflowDTO.getChildren().add(actionResourceEntityView);
            }
            if (!CollectionUtils.isEmpty(actionCollectionDTOs)) {
                EntityView actionCollectionResourceEntityView = new EntityView();
                actionCollectionResourceEntityView.setType(ActionCollection.class.getSimpleName());
                actionCollectionResourceEntityView.setEntities((List) actionCollectionDTOs);
                workflowDTO.getChildren().add(actionCollectionResourceEntityView);
            }
            return workflowDTO;
        });
    }

    private Collection<ActionResourceDTO> getActionDTOs(String permissionGroupId, Collection<NewAction> actions) {
        if (CollectionUtils.isEmpty(actions)) {
            return null;
        }
        return actions.stream()
                .map(action -> {
                    ActionResourceDTO actionDTO = new ActionResourceDTO();
                    actionDTO.setId(action.getId());
                    actionDTO.setName(action.getUnpublishedAction().getName());
                    actionDTO.setPluginId(action.getPluginId());
                    Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                            WORKFLOWS, permissionGroupId, action.getPolicies(), Action.class, policyGenerator);
                    actionDTO.setEnabled(permissionsTuple.getT1());
                    actionDTO.setEditable(permissionsTuple.getT2());
                    return actionDTO;
                })
                .collect(Collectors.toList());
    }

    private Collection<ActionCollectionResourceDTO> getActionCollectionDTOs(
            String permissionGroupId, Workflow workflow, Collection<ActionCollection> actionCollections) {
        if (CollectionUtils.isEmpty(actionCollections)) {
            return null;
        }
        return actionCollections.stream()
                .map(actionCollection -> {
                    ActionCollectionResourceDTO actionCollectionResourceDTO = new ActionCollectionResourceDTO();
                    actionCollectionResourceDTO.setId(actionCollection.getId());
                    actionCollectionResourceDTO.setIsDefault(
                            workflow.getMainJsObjectId().equalsIgnoreCase(actionCollection.getId()));
                    actionCollectionResourceDTO.setName(
                            actionCollection.getUnpublishedCollection().getName());
                    Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                            WORKFLOWS,
                            permissionGroupId,
                            actionCollection.getPolicies(),
                            Action.class,
                            policyGenerator);
                    actionCollectionResourceDTO.setEnabled(permissionsTuple.getT1());
                    actionCollectionResourceDTO.setEditable(permissionsTuple.getT2());
                    return actionCollectionResourceDTO;
                })
                .collect(Collectors.toList());
    }
}
