package com.appsmith.server.actioncollections.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
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
import com.appsmith.server.modules.moduleentity.ModuleEntityService;
import com.appsmith.server.modules.permissions.ModulePermissionChecker;
import com.appsmith.server.newactions.base.NewActionService;
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
    private final ActionPermission actionPermission;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ActionCollection> createPrivateEntity(Reusable entity) {

        ActionCollectionDTO actionCollectionDTO = (ActionCollectionDTO) entity;

        // branchName handling is left as a TODO for future git implementation for git connected modules.

        if (!StringUtils.hasLength(actionCollectionDTO.getModuleId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.MODULE_ID));
        }

        return modulePermissionChecker
                .checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(
                        actionCollectionDTO.getModuleId(), Optional.ofNullable(actionCollectionDTO.getWorkspaceId()))
                .flatMap(tuple -> {
                    Module module = tuple.getT1();
                    String workspaceId = tuple.getT2();
                    ActionCollection moduleActionCollection = JSModuleEntityHelper.generateActionCollectionDomain(
                            actionCollectionDTO.getModuleId(), workspaceId, false, actionCollectionDTO);
                    Set<Policy> childActionCollectionPolicies =
                            policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, Action.class);
                    moduleActionCollection.setPolicies(childActionCollectionPolicies);

                    return Mono.just(moduleActionCollection);
                });
    }

    @Override
    public Mono<List<Reusable>> getAllEntitiesForPackageEditor(String contextId, CreatorContextType contextType) {
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
                                return (Reusable) actionCollectionDTO;
                            })
                            .collectList());
        });
    }
}
