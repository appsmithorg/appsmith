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
import com.appsmith.server.moduleinstantiation.ModuleInstantiatingService;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NewActionInstantiatingServiceImpl implements ModuleInstantiatingService<NewAction> {
    private final NewActionRepository newActionRepository;
    private final ActionPermission actionPermission;
    private final PolicyGenerator policyGenerator;
    private final RefactoringService refactoringService;
    private final NewActionService newActionService;

    @Override
    public Mono<Void> instantiateEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        Flux<NewAction> sourceActionFlux = newActionRepository.findAllPublishedActionsByContextIdAndContextType(
                moduleInstantiatingMetaDTO.getSourceModuleId(),
                CreatorContextType.MODULE,
                actionPermission.getExecutePermission(),
                false);
        return sourceActionFlux
                .flatMap(sourceAction -> {
                    NewAction toBeInstantiatedAction = createNewActionFromSourceAction(sourceAction);
                    setUnpublishedAndPublishedData(sourceAction, toBeInstantiatedAction);

                    ActionDTO unpublishedAction = toBeInstantiatedAction.getUnpublishedAction();
                    setFullyQualifiedName(moduleInstantiatingMetaDTO, unpublishedAction);
                    setContextTypeAndContextId(moduleInstantiatingMetaDTO, toBeInstantiatedAction);

                    resetIsPublicAttributeForComposedModuleInstances(toBeInstantiatedAction);

                    setRootModuleInstanceIdAndModuleInstanceId(
                            moduleInstantiatingMetaDTO, sourceAction, toBeInstantiatedAction);

                    setDefaultResources(moduleInstantiatingMetaDTO, sourceAction, toBeInstantiatedAction);

                    setPolicies(moduleInstantiatingMetaDTO, toBeInstantiatedAction);

                    Map<String, RefactorEntityNameDTO> oldToNewModuleEntityRefactorDTOsMap =
                            moduleInstantiatingMetaDTO.getOldToNewModuleEntityRefactorDTOsMap();

                    Mono<NewAction> newActionMono = refactorAndExtractJsonPathKeysForAction(
                            toBeInstantiatedAction,
                            unpublishedAction,
                            moduleInstantiatingMetaDTO,
                            oldToNewModuleEntityRefactorDTOsMap);

                    return newActionMono;
                })
                .collectList()
                .flatMap(toBeInstantiatedActions ->
                        newActionRepository.saveAll(toBeInstantiatedActions).then());
    }

    private void setFullyQualifiedName(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, ActionDTO unpublishedAction) {
        unpublishedAction.setName(ModuleUtils.getValidName(
                moduleInstantiatingMetaDTO.getRootModuleInstanceName(), unpublishedAction.getName()));
    }

    private Mono<NewAction> refactorAndExtractJsonPathKeysForAction(
            NewAction toBeInstantiatedAction,
            ActionDTO unpublishedAction,
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            Map<String, RefactorEntityNameDTO> oldToNewModuleEntityRefactorDTOsMap) {

        // For each entity name, call refactor current entity
        Mono<NewAction> newActionMono = Flux.fromIterable(oldToNewModuleEntityRefactorDTOsMap.values())
                .concatMap(refactorEntityNameDTO -> refactoringService.refactorCurrentEntity(
                        unpublishedAction,
                        EntityType.ACTION,
                        refactorEntityNameDTO,
                        moduleInstantiatingMetaDTO.getEvalVersionMono()))
                .then(Mono.defer(() -> {
                    // After all refactors, call extractAndSetJsonPathKeys for the current entity
                    newActionService.extractAndSetJsonPathKeys(toBeInstantiatedAction);
                    return Mono.just(toBeInstantiatedAction);
                }));

        return newActionMono;
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

    private void setPolicies(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, NewAction toBeInstantiatedAction) {
        Set<Policy> policies = policyGenerator.getAllChildPolicies(
                moduleInstantiatingMetaDTO.getPage().getPolicies(), Page.class, Action.class);

        toBeInstantiatedAction.setPolicies(policies);
    }

    private void setDefaultResources(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            NewAction sourceAction,
            NewAction toBeInstantiatedAction) {
        DefaultResources defaultResources = sourceAction.getDefaultResources();
        defaultResources.setBranchName(moduleInstantiatingMetaDTO.getBranchName());
        defaultResources.setActionId(toBeInstantiatedAction.getId());
        defaultResources.setModuleInstanceId(toBeInstantiatedAction.getModuleInstanceId());
        defaultResources.setPageId(
                moduleInstantiatingMetaDTO.getPage().getDefaultResources().getPageId());

        toBeInstantiatedAction.setDefaultResources(defaultResources);
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

    private void setUnpublishedAndPublishedData(NewAction sourceAction, NewAction toBeInstantiatedAction) {
        toBeInstantiatedAction.setUnpublishedAction(sourceAction.getPublishedAction());
        toBeInstantiatedAction.setPublishedAction(new ActionDTO());
    }

    private NewAction createNewActionFromSourceAction(NewAction sourceAction) {
        NewAction toBeInstantiatedAction = new NewAction();
        AppsmithBeanUtils.copyNestedNonNullProperties(sourceAction, toBeInstantiatedAction);
        toBeInstantiatedAction.setId(new ObjectId().toString());
        return toBeInstantiatedAction;
    }
}
