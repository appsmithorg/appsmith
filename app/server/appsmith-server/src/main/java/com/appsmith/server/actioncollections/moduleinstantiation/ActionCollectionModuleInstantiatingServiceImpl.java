package com.appsmith.server.actioncollections.moduleinstantiation;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.moduleinstantiation.JSActionType;
import com.appsmith.server.moduleinstantiation.ModuleInstantiatingService;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
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
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActionCollectionModuleInstantiatingServiceImpl
        implements ModuleInstantiatingService<ActionCollection, ActionCollection> {
    private final ActionCollectionService actionCollectionService;
    private final ActionCollectionRepository actionCollectionRepository;
    private final ModuleInstantiatingService<JSActionType, NewAction> jsActionInstantiatingService;
    private final PolicyGenerator policyGenerator;
    private final RefactoringService refactoringService;
    private final DefaultResourcesService<ActionCollection> defaultResourcesService;
    private final DefaultResourcesService<ActionCollectionDTO> dtoDefaultResourcesService;

    @Override
    public Mono<Void> instantiateEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        return createCollectionsToInstantiate(moduleInstantiatingMetaDTO).flatMap(newCollectionIdToNewCollectionMap -> {
            return jsActionInstantiatingService
                    .instantiateEntities(moduleInstantiatingMetaDTO)
                    .then(Mono.defer(() -> {
                        // Update the `defaultToBranchedActionIdsMap` field for the instantiated
                        // actionCollection
                        for (Map.Entry<String, ActionCollection> entry : newCollectionIdToNewCollectionMap.entrySet()) {
                            ActionCollection toBeInstantiatedActionCollection = entry.getValue();
                            List<String> newActionIds = moduleInstantiatingMetaDTO
                                    .getNewCollectionIdToNewActionIdsMap()
                                    .getOrDefault(entry.getKey(), new ArrayList<>());

                            Map<String, String> defaultToBranchedActionIdsMap = newActionIds.stream()
                                    .collect(Collectors.toMap(newActionId -> newActionId, newActionId -> newActionId));
                            toBeInstantiatedActionCollection
                                    .getUnpublishedCollection()
                                    .setDefaultToBranchedActionIdsMap(defaultToBranchedActionIdsMap);
                        }
                        return actionCollectionService
                                .saveAll(newCollectionIdToNewCollectionMap.values().stream()
                                        .toList())
                                .collectList();
                    }))
                    .then();
        });
    }

    private Mono<Map<String, ActionCollection>> createCollectionsToInstantiate(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        Flux<ActionCollection> actionCollectionFlux =
                actionCollectionRepository.findAllPublishedActionCollectionsByContextIdAndContextType(
                        moduleInstantiatingMetaDTO.getSourceModuleId(), CreatorContextType.MODULE, null);

        final List<String> sourceCollectionIds = new ArrayList<>();
        final Map<String, String> oldToNewCollectionIdMap = new HashMap<>();

        return actionCollectionFlux.collectList().flatMap(sourceActionCollections -> {
            // Calculating policies at the beginning to avoid doing the same task for all nested entities as policies
            // would remain same
            Set<Policy> policies = policyGenerator.getAllChildPolicies(
                    moduleInstantiatingMetaDTO.getPage().getPolicies(), NewPage.class, NewAction.class);

            Mono<Map<String, ActionCollection>> newCollectionIdToNewCollectionMapMono = Flux.fromIterable(
                            sourceActionCollections)
                    .flatMap(sourceActionCollection -> {
                        sourceCollectionIds.add(sourceActionCollection.getId());
                        return generateActionCollection(
                                moduleInstantiatingMetaDTO, sourceActionCollection, oldToNewCollectionIdMap, policies);
                    })
                    .collect(Collectors.toMap(ActionCollection::getId, Function.identity()));

            return newCollectionIdToNewCollectionMapMono.map(newCollectionIdToNewCollectionMap -> {
                moduleInstantiatingMetaDTO.setSourceCollectionIds(sourceCollectionIds);
                moduleInstantiatingMetaDTO.setOldToNewCollectionIdMap(oldToNewCollectionIdMap);

                return newCollectionIdToNewCollectionMap;
            });
        });
    }

    @Override
    public Mono<List<ActionCollection>> generateInstantiatedEntities(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        return createCollectionsToInstantiate(moduleInstantiatingMetaDTO).flatMap(newCollectionIdToNewCollectionMap -> {
            return jsActionInstantiatingService
                    .generateInstantiatedEntities(moduleInstantiatingMetaDTO)
                    .map(list -> list.stream()
                            .collect(Collectors.toMap(
                                    newAction ->
                                            newAction.getUnpublishedAction().getCollectionId(),
                                    newAction -> {
                                        ArrayList<NewAction> actionList = new ArrayList<>();
                                        actionList.add(newAction);
                                        return actionList;
                                    },
                                    (a1, a2) -> {
                                        a1.addAll(a2);
                                        return a1;
                                    })))
                    .map(collectionIdToActionsMap -> {
                        // Update the `defaultToBranchedActionIdsMap` field for the instantiated
                        // actionCollection
                        for (Map.Entry<String, ActionCollection> entry : newCollectionIdToNewCollectionMap.entrySet()) {
                            ActionCollection toBeInstantiatedActionCollection = entry.getValue();
                            Map<String, List<NewAction>> originCollectionIdToNewActionsMap =
                                    moduleInstantiatingMetaDTO.getOriginCollectionIdToNewActionsMap();

                            originCollectionIdToNewActionsMap.put(
                                    toBeInstantiatedActionCollection.getOriginActionCollectionId(),
                                    collectionIdToActionsMap.get(toBeInstantiatedActionCollection.getId()));

                            List<String> newActionIds =
                                    collectionIdToActionsMap.get(toBeInstantiatedActionCollection.getId()).stream()
                                            .map(NewAction::getId)
                                            .toList();

                            Map<String, String> defaultToBranchedActionIdsMap = newActionIds.stream()
                                    .collect(Collectors.toMap(newActionId -> newActionId, newActionId -> newActionId));
                            toBeInstantiatedActionCollection
                                    .getUnpublishedCollection()
                                    .setDefaultToBranchedActionIdsMap(defaultToBranchedActionIdsMap);
                        }
                        return newCollectionIdToNewCollectionMap.values().stream()
                                .toList();
                    });
        });
    }

    private Mono<ActionCollection> generateActionCollection(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            ActionCollection sourceActionCollection,
            Map<String, String> oldToNewCollectionIdMap,
            Set<Policy> policies) {
        ActionCollection toBeInstantiatedActionCollection = createActionCollectionFromSource(sourceActionCollection);
        setUnpublishedAndPublishedData(sourceActionCollection, toBeInstantiatedActionCollection);

        // keeping track of old collection id and new collection id
        oldToNewCollectionIdMap.put(sourceActionCollection.getId(), toBeInstantiatedActionCollection.getId());

        ActionCollectionDTO unpublishedActionCollectionDTO =
                toBeInstantiatedActionCollection.getUnpublishedCollection();

        setModifiedName(moduleInstantiatingMetaDTO, unpublishedActionCollectionDTO);
        setContextTypeAndContextId(toBeInstantiatedActionCollection, moduleInstantiatingMetaDTO);

        resetIsPublicAttributeForComposedModuleInstances(toBeInstantiatedActionCollection);

        setRootModuleInstanceIdAndModuleInstanceId(
                moduleInstantiatingMetaDTO, sourceActionCollection, toBeInstantiatedActionCollection);

        DefaultResources domainDefaultResources = new DefaultResources();
        domainDefaultResources.setApplicationId(
                moduleInstantiatingMetaDTO.getPage().getDefaultResources().getApplicationId());
        toBeInstantiatedActionCollection.setDefaultResources(domainDefaultResources);

        DefaultResources dtoDefaultResources = new DefaultResources();
        dtoDefaultResources.setPageId(
                moduleInstantiatingMetaDTO.getPage().getDefaultResources().getPageId());
        unpublishedActionCollectionDTO.setDefaultResources(dtoDefaultResources);

        defaultResourcesService.initialize(
                toBeInstantiatedActionCollection, moduleInstantiatingMetaDTO.getBranchName(), false);
        dtoDefaultResourcesService.initialize(
                unpublishedActionCollectionDTO, moduleInstantiatingMetaDTO.getBranchName(), false);
        toBeInstantiatedActionCollection.setGitSyncId(null);

        // Set the truncated policies for this new instance
        toBeInstantiatedActionCollection.setPolicies(policies);

        return refactorForActionCollection(
                moduleInstantiatingMetaDTO, unpublishedActionCollectionDTO, toBeInstantiatedActionCollection);
    }

    private void setModifiedName(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, ActionCollectionDTO actionCollectionDTO) {
        actionCollectionDTO.setName(ModuleUtils.getValidName(
                moduleInstantiatingMetaDTO.getRootModuleInstanceName(), actionCollectionDTO.getName()));
    }

    private void setUnpublishedAndPublishedData(
            ActionCollection sourceActionCollection, ActionCollection toBeInstantiatedActionCollection) {
        // Set the published data of source to the unpublished data of the new instance
        toBeInstantiatedActionCollection.setUnpublishedCollection(sourceActionCollection.getPublishedCollection());
        // Reset the published data with an empty DTO
        toBeInstantiatedActionCollection.setPublishedCollection(new ActionCollectionDTO());
    }

    private ActionCollection createActionCollectionFromSource(ActionCollection sourceActionCollection) {
        // Create a new ActionCollection instance to be instantiated
        ActionCollection toBeInstantiatedActionCollection = new ActionCollection();

        // Copy non-null properties from sourceActionCollection to the new instance
        AppsmithBeanUtils.copyNestedNonNullProperties(sourceActionCollection, toBeInstantiatedActionCollection);
        // Give a new id
        toBeInstantiatedActionCollection.setId(new ObjectId().toString());
        return toBeInstantiatedActionCollection;
    }

    private Mono<ActionCollection> refactorForActionCollection(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            ActionCollectionDTO unpublishedActionCollectionDTO,
            ActionCollection toBeInstantiatedActionCollection) {
        Map<String, RefactorEntityNameDTO> oldToNewModuleEntityRefactorDTOsMap =
                moduleInstantiatingMetaDTO.getOldToNewModuleEntityRefactorDTOsMap();

        // For each entity name in the map, refactor the current entity
        return Flux.fromIterable(oldToNewModuleEntityRefactorDTOsMap.values())
                .concatMap(refactorEntityNameDTO -> refactoringService.refactorCurrentEntity(
                        unpublishedActionCollectionDTO,
                        EntityType.JS_OBJECT,
                        refactorEntityNameDTO,
                        moduleInstantiatingMetaDTO.getEvalVersionMono()))
                .then(Mono.just(toBeInstantiatedActionCollection));
    }

    private void setRootModuleInstanceIdAndModuleInstanceId(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            ActionCollection sourceActionCollection,
            ActionCollection toBeInstantiatedActionCollection) {
        // Set rootModuleInstanceId and moduleInstanceId
        toBeInstantiatedActionCollection.setRootModuleInstanceId(moduleInstantiatingMetaDTO.getRootModuleInstanceId());
        toBeInstantiatedActionCollection.setModuleInstanceId(moduleInstantiatingMetaDTO
                .getOldToNewModuleInstanceIdMap()
                .getOrDefault(
                        sourceActionCollection.getModuleInstanceId(),
                        moduleInstantiatingMetaDTO.getRootModuleInstanceId()));
    }

    private void resetIsPublicAttributeForComposedModuleInstances(ActionCollection toBeInstantiatedActionCollection) {
        // Resetting the 'isPublic' attribute for entities of composed module instances.
        // Only the public entity of the requested module should remain public after instantiation.
        // All other public entities are considered private.
        // If the source 'actionCollection' was part of a module instance, it should be considered a private entity for
        // this module instance.
        if (toBeInstantiatedActionCollection.getModuleInstanceId() != null) {
            toBeInstantiatedActionCollection.setIsPublic(false);
        }
    }

    private void setContextTypeAndContextId(
            ActionCollection toBeInstantiatedActionCollection, ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        ActionCollectionDTO unpublishedActionCollectionDTO =
                toBeInstantiatedActionCollection.getUnpublishedCollection();
        unpublishedActionCollectionDTO.setContextType(moduleInstantiatingMetaDTO.getContextType());
        // Set the `contextId` value to the respective field base on the `contextType`
        if (CreatorContextType.PAGE.equals(moduleInstantiatingMetaDTO.getContextType())) {
            toBeInstantiatedActionCollection.setApplicationId(
                    moduleInstantiatingMetaDTO.getPage().getApplicationId());
            unpublishedActionCollectionDTO.setPageId(moduleInstantiatingMetaDTO.getContextId());
            unpublishedActionCollectionDTO.setModuleId(null);
        } else if (CreatorContextType.MODULE.equals(moduleInstantiatingMetaDTO.getContextType())) {
            unpublishedActionCollectionDTO.setModuleId(moduleInstantiatingMetaDTO.getContextId());
            unpublishedActionCollectionDTO.setPageId(null);
            // TODO: Add packageId
        }
    }
}
