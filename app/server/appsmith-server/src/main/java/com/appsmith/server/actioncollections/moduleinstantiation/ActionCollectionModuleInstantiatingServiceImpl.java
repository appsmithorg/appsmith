package com.appsmith.server.actioncollections.moduleinstantiation;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.moduleinstantiation.JSActionType;
import com.appsmith.server.moduleinstantiation.ModuleInstantiatingService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.solutions.ActionPermission;
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
public class ActionCollectionModuleInstantiatingServiceImpl implements ModuleInstantiatingService<ActionCollection> {
    private final ActionCollectionRepository actionCollectionRepository;
    private final ModuleInstantiatingService<JSActionType> jsActionInstantiatingService;
    private final ActionPermission actionPermission;
    private final PolicyGenerator policyGenerator;
    private final RefactoringService refactoringSolution;

    @Override
    public Mono<Void> instantiateEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        Flux<ActionCollection> actionCollectionFlux =
                actionCollectionRepository.findAllPublishedActionCollectionsByContextIdAndContextType(
                        moduleInstantiatingMetaDTO.getSourceModuleId(),
                        CreatorContextType.MODULE,
                        actionPermission.getReadPermission());

        final List<String> sourceCollectionIds = new ArrayList<>();
        final Map<String, String> oldToNewCollectionIdMap = new HashMap<>();

        return actionCollectionFlux.collectList().flatMap(sourceActionCollections -> {
            // Calculating policies at the beginning to avoid doing the same task for all nested entities as policies
            // would remain same
            Set<Policy> policies = policyGenerator.getAllChildPolicies(
                    moduleInstantiatingMetaDTO.getPage().getPolicies(), Page.class, Action.class);

            Mono<Map<String, ActionCollection>> newCollectionIdToNewCollectionMapMono = Flux.fromIterable(
                            sourceActionCollections)
                    .flatMap(sourceActionCollection -> {
                        sourceCollectionIds.add(sourceActionCollection.getId());
                        return createActionCollectionAndCollectAsMap(
                                moduleInstantiatingMetaDTO, sourceActionCollection, oldToNewCollectionIdMap, policies);
                    })
                    .collect(Collectors.toMap(ActionCollection::getId, Function.identity()));

            return newCollectionIdToNewCollectionMapMono.flatMap(newCollectionIdToNewCollectionMap -> {
                moduleInstantiatingMetaDTO.setSourceCollectionIds(sourceCollectionIds);
                moduleInstantiatingMetaDTO.setOldToNewCollectionIdMap(oldToNewCollectionIdMap);
                return jsActionInstantiatingService
                        .instantiateEntities(moduleInstantiatingMetaDTO)
                        .then(Mono.defer(() -> {
                            // Update the `defaultToBranchedActionIdsMap` field for the instantiated
                            // actionCollection
                            for (Map.Entry<String, ActionCollection> entry :
                                    newCollectionIdToNewCollectionMap.entrySet()) {
                                ActionCollection toBeInstantiatedActionCollection = entry.getValue();
                                List<String> newActionIds = moduleInstantiatingMetaDTO
                                        .getNewCollectionIdToNewActionsMap()
                                        .getOrDefault(entry.getKey(), new ArrayList<>());

                                Map<String, String> defaultToBranchedActionIdsMap = newActionIds.stream()
                                        .collect(Collectors.toMap(
                                                newActionId -> newActionId, newActionId -> newActionId));
                                toBeInstantiatedActionCollection
                                        .getUnpublishedCollection()
                                        .setDefaultToBranchedActionIdsMap(defaultToBranchedActionIdsMap);
                            }
                            return actionCollectionRepository
                                    .saveAll(newCollectionIdToNewCollectionMap.values())
                                    .collectList();
                        }))
                        .then();
            });
        });
    }

    private Mono<ActionCollection> createActionCollectionAndCollectAsMap(
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

        setContextTypeAndContextId(unpublishedActionCollectionDTO, moduleInstantiatingMetaDTO);

        resetIsPublicAttributeForComposedModuleInstances(toBeInstantiatedActionCollection);

        setRootModuleInstanceIdAndModuleInstanceId(
                moduleInstantiatingMetaDTO, sourceActionCollection, toBeInstantiatedActionCollection);

        setDefaultResources(moduleInstantiatingMetaDTO, toBeInstantiatedActionCollection);

        // Set the truncated policies for this new instance
        toBeInstantiatedActionCollection.setPolicies(policies);

        Mono<ActionCollection> actionCollectionMono = refactorForActionCollection(
                moduleInstantiatingMetaDTO, unpublishedActionCollectionDTO, toBeInstantiatedActionCollection);

        return actionCollectionMono;
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
        Mono<ActionCollection> actionCollectionMono = Flux.fromIterable(oldToNewModuleEntityRefactorDTOsMap.values())
                .concatMap(refactorEntityNameDTO -> refactoringSolution.refactorCurrentEntity(
                        unpublishedActionCollectionDTO,
                        EntityType.JS_OBJECT,
                        refactorEntityNameDTO,
                        moduleInstantiatingMetaDTO.getEvalVersionMono()))
                .then(Mono.just(toBeInstantiatedActionCollection));
        return actionCollectionMono;
    }

    private void setDefaultResources(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, ActionCollection toBeInstantiatedActionCollection) {
        // Set relevant fields in the default resources
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(moduleInstantiatingMetaDTO.getContextId());
        defaultResources.setBranchName(moduleInstantiatingMetaDTO.getBranchName());
        defaultResources.setCollectionId(toBeInstantiatedActionCollection.getId());

        toBeInstantiatedActionCollection.setDefaultResources(defaultResources);
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
            ActionCollectionDTO unpublishedActionCollectionDTO, ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        unpublishedActionCollectionDTO.setContextType(moduleInstantiatingMetaDTO.getContextType());
        // Set the `contextId` value to the respective field base on the `contextType`
        if (CreatorContextType.PAGE.equals(moduleInstantiatingMetaDTO.getContextType())) {
            unpublishedActionCollectionDTO.setApplicationId(
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
