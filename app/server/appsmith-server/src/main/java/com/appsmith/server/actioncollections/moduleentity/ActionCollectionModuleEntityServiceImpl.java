package com.appsmith.server.actioncollections.moduleentity;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.modules.moduleentity.ModuleEntityService;
import com.appsmith.server.modules.permissions.ModulePermissionChecker;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActionCollectionModuleEntityServiceImpl implements ModuleEntityService<ActionCollection> {

    private final ModulePermissionChecker modulePermissionChecker;
    private final PolicyGenerator policyGenerator;
    private final ActionCollectionService actionCollectionService;
    private final ActionPermission actionPermission;
    private final NewActionService newActionService;
    private final LayoutActionService layoutActionService;

    @Override
    public Mono<ModuleConsumable> createPublicEntity(
            String workspaceId, Module module, ModuleConsumable moduleConsumable) {
        return this.createModuleActionCollection(
                Optional.of(workspaceId), module.getId(), (ActionCollectionDTO) moduleConsumable, true);
    }

    private Mono<ModuleConsumable> createModuleActionCollection(
            Optional<String> workspaceIdOptional,
            String moduleId,
            ActionCollectionDTO actionCollectionDTO,
            boolean isPublic) {
        return modulePermissionChecker
                .checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(moduleId, workspaceIdOptional)
                .flatMap(tuple -> {
                    Module module = tuple.getT1();
                    String workspaceId = tuple.getT2();
                    ActionCollection moduleActionCollection =
                            generateActionCollectionDomain(moduleId, workspaceId, isPublic, actionCollectionDTO);
                    Set<Policy> childActionCollectionPolicies =
                            policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, Action.class);
                    moduleActionCollection.setPolicies(childActionCollectionPolicies);

                    return actionCollectionService
                            .validateAndSaveCollection(moduleActionCollection)
                            .flatMap(collectionDTO1 -> {
                                List<ActionDTO> actions = collectionDTO1.getActions();

                                if (actions == null || actions.isEmpty()) {
                                    return Mono.just((ModuleConsumable) collectionDTO1);
                                }

                                return Flux.fromIterable(actions)
                                        .flatMap(action ->
                                                layoutActionService.updateSingleAction(action.getId(), action))
                                        .collectList()
                                        .then(Mono.just((ModuleConsumable) collectionDTO1));
                            });
                });
    }

    private ActionCollection generateActionCollectionDomain(
            String moduleId, String workspaceId, boolean isPublic, ActionCollectionDTO actionCollectionDTO) {
        ActionCollection actionCollection = new ActionCollection();
        actionCollection.setWorkspaceId(workspaceId);
        actionCollection.setIsPublic(isPublic);

        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setIsPublic(isPublic);
        actionCollectionDTO.setModuleId(moduleId);
        actionCollectionDTO.setDefaultResources(new DefaultResources());
        actionCollectionDTO.setContextType(CreatorContextType.MODULE);

        // Ensure that all actions in the collection have the same contextType and moduleId as the collection itself
        actionCollectionDTO.getActions().stream().forEach(action -> {
            action.setIsPublic(isPublic);
            action.setModuleId(moduleId);
            action.setContextType(CreatorContextType.MODULE);
        });

        actionCollection.setUnpublishedCollection(actionCollectionDTO);
        actionCollection.setPublishedCollection(new ActionCollectionDTO());
        actionCollection.setDefaultResources(new DefaultResources());

        return actionCollection;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleConsumable> createPrivateEntity(ModuleConsumable entity, String branchName) {

        ActionCollectionDTO actionCollectionDTO = (ActionCollectionDTO) entity;

        // branchName handling is left as a TODO for future git implementation for git connected modules.

        if (!StringUtils.hasLength(actionCollectionDTO.getModuleId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.MODULE_ID));
        }

        return this.createModuleActionCollection(
                Optional.empty(), actionCollectionDTO.getModuleId(), actionCollectionDTO, false);
    }

    @Override
    public Mono<List<ModuleConsumable>> getAllEntitiesForPackageEditor(
            String contextId, CreatorContextType contextType) {
        Flux<ActionCollection> actionCollectionFlux =
                actionCollectionService.findAllActionCollectionsByContextIdAndContextTypeAndViewMode(
                        contextId, contextType, actionPermission.getEditPermission(), false);

        Mono<List<ActionCollectionDTO>> actionCollectionsMono = actionCollectionFlux
                .flatMap(actionCollection ->
                        actionCollectionService.generateActionCollectionByViewMode(actionCollection, false))
                .collectList();

        return actionCollectionsMono.flatMap(actionCollections -> {
            List<String> collectionIds = actionCollections.stream()
                    .map(actionCollection -> actionCollection.getId())
                    .collect(Collectors.toList());

            Map<String, ActionCollectionDTO> collectionIdToActionCollectionMap = actionCollections.stream()
                    .collect(Collectors.toMap(
                            actionCollection -> actionCollection.getId(), actionCollection -> actionCollection));

            final Map<String, List<ActionDTO>> collectionIdToActionsMap = new HashMap<>();

            return newActionService
                    .findAllJSActionsByCollectionIds(collectionIds, null)
                    .flatMap(jsAction -> newActionService.generateActionByViewMode(jsAction, false))
                    .map(actionDTO -> {
                        List<ActionDTO> childActionDTOs =
                                collectionIdToActionsMap.getOrDefault(actionDTO.getCollectionId(), new ArrayList<>());
                        childActionDTOs.add(actionDTO);
                        collectionIdToActionsMap.put(actionDTO.getCollectionId(), childActionDTOs);
                        return actionDTO;
                    })
                    .collectList()
                    .then(Flux.fromIterable(collectionIdToActionCollectionMap.values())
                            .map(actionCollectionDTO -> {
                                List<ActionDTO> actions = collectionIdToActionsMap.get(actionCollectionDTO.getId());
                                actionCollectionDTO.setActions(actions);
                                return (ModuleConsumable) actionCollectionDTO;
                            })
                            .collectList());
        });
    }

    @Override
    public Mono<Object> getPublicEntitySettingsForm(String moduleId) {
        return Mono.just(List.of());
    }
}
