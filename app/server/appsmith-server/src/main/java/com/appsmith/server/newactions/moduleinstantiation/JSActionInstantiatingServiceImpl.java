package com.appsmith.server.newactions.moduleinstantiation;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.moduleinstantiation.JSActionType;
import com.appsmith.server.moduleinstantiation.ModuleInstantiatingService;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.NewActionRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class JSActionInstantiatingServiceImpl implements ModuleInstantiatingService<JSActionType, NewAction> {
    private final NewActionRepository newActionRepository;
    private final NewActionService newActionService;
    private final PolicyGenerator policyGenerator;
    private final RefactoringService refactoringService;

    @Override
    public Mono<Void> instantiateEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        return generateInstantiatedEntities(moduleInstantiatingMetaDTO)
                .flatMapMany(newActionRepository::saveAll)
                .then();
    }

    @Override
    public Mono<List<NewAction>> generateInstantiatedEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        final Map<String, List<String>> newCollectionIdToNewActionsMap = new HashMap<>();
        return newActionRepository
                .findAllByCollectionIds(moduleInstantiatingMetaDTO.getSourceCollectionIds(), null, true)
                .flatMap(sourceAction -> {
                    String newCollectionId = extractNewCollectionId(moduleInstantiatingMetaDTO, sourceAction);
                    NewAction toBeInstantiatedAction = createNewJSActionFromSource(sourceAction);
                    setUnpublishedAndPublishedData(sourceAction, toBeInstantiatedAction);

                    ActionDTO unpublishedAction = toBeInstantiatedAction.getUnpublishedAction();
                    unpublishedAction.setCollectionId(newCollectionId);

                    setModifiedFullyQualifiedName(moduleInstantiatingMetaDTO, unpublishedAction);
                    setContextTypeAndContextId(moduleInstantiatingMetaDTO, toBeInstantiatedAction);

                    resetIsPublicAttributeForComposedModuleInstances(toBeInstantiatedAction);

                    setRootModuleInstanceIdAndModuleInstanceId(
                            moduleInstantiatingMetaDTO, sourceAction, toBeInstantiatedAction);

                    setDefaultResources(moduleInstantiatingMetaDTO, toBeInstantiatedAction, newCollectionId);

                    List<String> newJSActions =
                            newCollectionIdToNewActionsMap.getOrDefault(newCollectionId, new ArrayList<>());
                    newJSActions.add(toBeInstantiatedAction.getId());
                    newCollectionIdToNewActionsMap.put(newCollectionId, newJSActions);

                    setPolicies(moduleInstantiatingMetaDTO, toBeInstantiatedAction);

                    return refactorAndExtractJsonPathKeysForJSAction(
                            moduleInstantiatingMetaDTO, toBeInstantiatedAction);
                })
                .collectList()
                .doOnNext(toBeInstantiatedJSActions ->
                        moduleInstantiatingMetaDTO.setNewCollectionIdToNewActionIdsMap(newCollectionIdToNewActionsMap));
    }

    private Mono<NewAction> refactorAndExtractJsonPathKeysForJSAction(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, NewAction toBeInstantiatedAction) {
        Map<String, RefactorEntityNameDTO> oldToNewModuleEntityRefactorDTOsMap =
                moduleInstantiatingMetaDTO.getOldToNewModuleEntityRefactorDTOsMap();

        //  For each entity name, call refactor current entity
        return Flux.fromIterable(oldToNewModuleEntityRefactorDTOsMap.values())
                .concatMap(refactorEntityNameDTO -> newActionService
                        .generateActionByViewMode(toBeInstantiatedAction, false)
                        .flatMap(actionDTO -> refactoringService.refactorCurrentEntity(
                                actionDTO,
                                EntityType.JS_ACTION,
                                refactorEntityNameDTO,
                                moduleInstantiatingMetaDTO.getEvalVersionMono())))
                .then(Mono.defer(() -> {
                    // After all refactors, call extractAndSetJsonPathKeys for the current entity
                    return newActionService
                            .extractAndSetJsonPathKeys(toBeInstantiatedAction)
                            .map(actionWithJsonPathKeys -> toBeInstantiatedAction);
                }));
    }

    private void setDefaultResources(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            NewAction toBeInstantiatedAction,
            String newCollectionId) {
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setActionId(toBeInstantiatedAction.getId());
        defaultResources.setModuleInstanceId(toBeInstantiatedAction.getModuleInstanceId());
        defaultResources.setCollectionId(newCollectionId);
        defaultResources.setPageId(moduleInstantiatingMetaDTO.getContextId());
        defaultResources.setBranchName(moduleInstantiatingMetaDTO.getBranchName());
        toBeInstantiatedAction.setDefaultResources(defaultResources);
        toBeInstantiatedAction.getUnpublishedAction().setDefaultResources(defaultResources);
    }

    private void setRootModuleInstanceIdAndModuleInstanceId(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            NewAction sourceAction,
            NewAction toBeInstantiatedAction) {
        toBeInstantiatedAction.setRootModuleInstanceId(moduleInstantiatingMetaDTO.getRootModuleInstanceId());
        toBeInstantiatedAction.setModuleInstanceId(moduleInstantiatingMetaDTO
                .getOldToNewModuleInstanceIdMap()
                .getOrDefault(
                        sourceAction.getModuleInstanceId(), moduleInstantiatingMetaDTO.getRootModuleInstanceId()));
    }

    private void resetIsPublicAttributeForComposedModuleInstances(NewAction toBeInstantiatedAction) {
        // Resetting the 'isPublic' attribute for entities of composed module instances.
        // Only the public entity of the requested module should remain public after instantiation.
        // All other public entities are considered private.
        // If the source 'actionCollection' was part of a module instance, it should be considered a private
        // entity for this module instance.
        if (toBeInstantiatedAction.getModuleInstanceId() != null) {
            toBeInstantiatedAction.setIsPublic(false);
        }
    }

    private void setContextTypeAndContextId(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, NewAction toBeInstantiatedAction) {
        ActionDTO unpublishedAction = toBeInstantiatedAction.getUnpublishedAction();
        unpublishedAction.setContextType(moduleInstantiatingMetaDTO.getContextType());
        if (CreatorContextType.PAGE.equals(moduleInstantiatingMetaDTO.getContextType())) {
            toBeInstantiatedAction.setApplicationId(
                    moduleInstantiatingMetaDTO.getPage().getApplicationId());
            unpublishedAction.setPageId(moduleInstantiatingMetaDTO.getContextId());
            unpublishedAction.setModuleId(null);
        } else if (CreatorContextType.MODULE.equals(moduleInstantiatingMetaDTO.getContextType())) {
            unpublishedAction.setModuleId(moduleInstantiatingMetaDTO.getContextId());
            unpublishedAction.setPageId(null);
            // TODO: Add packageId
        }
    }

    private void setModifiedFullyQualifiedName(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, ActionDTO unpublishedAction) {
        unpublishedAction.setFullyQualifiedName(ModuleUtils.getValidName(
                moduleInstantiatingMetaDTO.getRootModuleInstanceName(), unpublishedAction.getFullyQualifiedName()));
    }

    private static void setUnpublishedAndPublishedData(NewAction sourceAction, NewAction toBeInstantiatedAction) {
        toBeInstantiatedAction.setUnpublishedAction(sourceAction.getPublishedAction());
        toBeInstantiatedAction.setPublishedAction(new ActionDTO());
    }

    private NewAction createNewJSActionFromSource(NewAction sourceAction) {
        NewAction toBeInstantiatedAction = new NewAction();
        AppsmithBeanUtils.copyNestedNonNullProperties(sourceAction, toBeInstantiatedAction);
        toBeInstantiatedAction.setId(new ObjectId().toString());
        return toBeInstantiatedAction;
    }

    private String extractNewCollectionId(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, NewAction sourceAction) {
        return moduleInstantiatingMetaDTO
                .getOldToNewCollectionIdMap()
                .get(sourceAction.getPublishedAction().getCollectionId());
    }

    private void setPolicies(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, NewAction toBeInstantiatedAction) {
        Set<Policy> policies = policyGenerator.getAllChildPolicies(
                moduleInstantiatingMetaDTO.getPage().getPolicies(), Page.class, Action.class);

        toBeInstantiatedAction.setPolicies(policies);
    }
}
