package com.appsmith.server.actioncollections.upgrade;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.PackagePublishingMetaDTO;
import com.appsmith.server.dtos.SimulatedModuleInstanceDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.publish.packages.upgradable.PackageUpgradableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@RequiredArgsConstructor
@Service
public class ActionCollectionPackageUpgradableServiceImpl implements PackageUpgradableService<ActionCollection> {

    private final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;

    @Override
    public Mono<Boolean> getUpgradableEntitiesReferences(PackagePublishingMetaDTO publishingMetaDTO) {

        return Flux.fromIterable(publishingMetaDTO
                        .getExistingModuleInstanceIdToModuleInstanceMap()
                        .keySet())
                .flatMap(moduleInstanceId -> {
                    Map<String, Map<String, List<NewAction>>> collectionIdToActionsMap =
                            publishingMetaDTO.getExistingComposedCollectionRefToNewActionsMap();
                    Map<String, List<NewAction>> originCollectionIdToActionsMap = new ConcurrentHashMap<>();
                    collectionIdToActionsMap.put(moduleInstanceId, originCollectionIdToActionsMap);
                    return actionCollectionService
                            .findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(moduleInstanceId, null)
                            .flatMap(actionCollection -> {
                                return newActionService
                                        .findAllJSActionsByCollectionIds(List.of(actionCollection.getId()), null)
                                        .collectList()
                                        .doOnNext(newActions -> originCollectionIdToActionsMap.put(
                                                actionCollection.getOriginActionCollectionId(), newActions))
                                        .thenReturn(actionCollection);
                            })
                            .collectMap(
                                    ActionCollection::getOriginActionCollectionId, actionCollection -> actionCollection)
                            .doOnNext(map -> publishingMetaDTO
                                    .getExistingComposedCollectionRefToActionCollectionMap()
                                    .put(moduleInstanceId, map));
                })
                .collectList()
                .thenReturn(true);
    }

    @Override
    public Mono<Boolean> updateExistingEntities(
            ModuleInstance existingModuleInstance,
            SimulatedModuleInstanceDTO simulatedModuleInstanceDTO,
            PackagePublishingMetaDTO publishingMetaDTO) {
        Map<String, Map<String, List<NewAction>>> collectionIdToActionsMap =
                publishingMetaDTO.getExistingComposedCollectionRefToNewActionsMap();
        Map<String, List<NewAction>> originCollectionIdToExistingJSActionsMap =
                collectionIdToActionsMap.get(existingModuleInstance.getId());

        Map<String, List<NewAction>> originCollectionIdToSimulatedJSActionsMap =
                simulatedModuleInstanceDTO.getOriginCollectionIdToActionsMap();

        Map<String, ActionCollection> originCollectionIdToExistingCollectionMap = publishingMetaDTO
                .getExistingComposedCollectionRefToActionCollectionMap()
                .get(existingModuleInstance.getId());

        Map<String, ActionCollection> originCollectionIdToSimulatedCollectionMap =
                simulatedModuleInstanceDTO.getOriginToCollectionMap();

        HashSet<String> toBeRemovedOriginCollectionIds =
                new HashSet<>(originCollectionIdToExistingCollectionMap.keySet());
        toBeRemovedOriginCollectionIds.removeAll(originCollectionIdToSimulatedCollectionMap.keySet());

        HashSet<String> toBeAddedOriginCollectionIds =
                new HashSet<>(originCollectionIdToSimulatedCollectionMap.keySet());
        toBeAddedOriginCollectionIds.removeAll(originCollectionIdToExistingCollectionMap.keySet());

        HashSet<String> toBeUpdatedOriginCollectionIds =
                new HashSet<>(originCollectionIdToSimulatedCollectionMap.keySet());
        toBeUpdatedOriginCollectionIds.retainAll(originCollectionIdToExistingCollectionMap.keySet());

        Mono<Boolean> updateExistingCollectionsMono = Flux.fromIterable(toBeUpdatedOriginCollectionIds)
                .flatMap(toBeUpdatedOriginCollectionId -> {
                    ActionCollection existingActionCollection =
                            originCollectionIdToExistingCollectionMap.get(toBeUpdatedOriginCollectionId);
                    ActionCollection simulatedActionCollection =
                            originCollectionIdToSimulatedCollectionMap.get(toBeUpdatedOriginCollectionId);
                    ActionCollectionDTO simulatedActionCollectionDTO =
                            simulatedActionCollection.getUnpublishedCollection();
                    ActionCollectionDTO existingActionCollectionDTO =
                            existingActionCollection.getUnpublishedCollection();

                    Map<String, NewAction> simulatedJSOriginActionIdToJSActionMap =
                            originCollectionIdToSimulatedJSActionsMap.get(toBeUpdatedOriginCollectionId).stream()
                                    .collect(Collectors.toMap(NewAction::getOriginActionId, newAction -> newAction));

                    Map<String, NewAction> existingJSOriginActionIdToJSActionMap =
                            originCollectionIdToExistingJSActionsMap.get(toBeUpdatedOriginCollectionId).stream()
                                    .collect(Collectors.toMap(NewAction::getOriginActionId, newAction -> newAction));

                    HashSet<String> toBeRemovedOriginActionIds =
                            new HashSet<>(existingJSOriginActionIdToJSActionMap.keySet());
                    toBeRemovedOriginActionIds.removeAll(simulatedJSOriginActionIdToJSActionMap.keySet());

                    HashSet<String> toBeAddedOriginActionIds =
                            new HashSet<>(simulatedJSOriginActionIdToJSActionMap.keySet());
                    toBeAddedOriginActionIds.removeAll(existingJSOriginActionIdToJSActionMap.keySet());

                    HashSet<String> toBeUpdatedOriginActionIds =
                            new HashSet<>(simulatedJSOriginActionIdToJSActionMap.keySet());
                    toBeUpdatedOriginActionIds.retainAll(existingJSOriginActionIdToJSActionMap.keySet());

                    Mono<Set<String>> updateExistingActionsMono = Flux.fromIterable(toBeUpdatedOriginActionIds)
                            .map(toBeUpdatedOriginActionId -> {
                                NewAction existingNewAction =
                                        existingJSOriginActionIdToJSActionMap.get(toBeUpdatedOriginActionId);
                                NewAction simulatedNewAction =
                                        simulatedJSOriginActionIdToJSActionMap.get(toBeUpdatedOriginActionId);
                                ActionDTO simulatedActionDTO = simulatedNewAction.getUnpublishedAction();
                                ActionDTO existingActionDTO = existingNewAction.getUnpublishedAction();

                                // Make sure to retain the collectionId reference
                                simulatedActionDTO.setCollectionId(existingActionDTO.getCollectionId());

                                if (Boolean.TRUE.equals(simulatedNewAction.getIsPublic())) {
                                    // Retain specific properties from the old public action
                                    simulatedActionDTO.setExecuteOnLoad(existingActionDTO.getExecuteOnLoad());
                                    simulatedActionDTO.setUserSetOnLoad(existingActionDTO.getUserSetOnLoad());
                                    simulatedActionDTO.setConfirmBeforeExecute(
                                            existingActionDTO.getConfirmBeforeExecute());
                                }

                                copyNestedNonNullProperties(simulatedActionDTO, existingActionDTO);
                                return existingNewAction;
                            })
                            .collectList()
                            .flatMapMany(newActionService::saveAll)
                            .mapNotNull(NewAction::getId)
                            .collect(Collectors.toSet());

                    Mono<Set<String>> deleteExistingActionsMono = Flux.fromIterable(toBeRemovedOriginActionIds)
                            .mapNotNull(toBeRemovedOriginActionId -> {
                                NewAction newAction =
                                        existingJSOriginActionIdToJSActionMap.get(toBeRemovedOriginActionId);
                                return newAction.getId();
                            })
                            .flatMap(newActionService::deleteUnpublishedAction)
                            .map(ActionDTO::getId)
                            .collect(Collectors.toSet());

                    Mono<Set<String>> createSimulatedActionsMono = Flux.fromIterable(toBeAddedOriginActionIds)
                            .mapNotNull(toBeAddedOriginActionId -> {
                                NewAction simulatedNewAction =
                                        simulatedJSOriginActionIdToJSActionMap.get(toBeAddedOriginActionId);
                                simulatedNewAction.setRootModuleInstanceId(existingModuleInstance.getId());
                                simulatedNewAction
                                        .getUnpublishedAction()
                                        .setCollectionId(existingActionCollection.getId());
                                simulatedNewAction
                                        .getDefaultResources()
                                        .setCollectionId(existingActionCollection.getId());
                                simulatedNewAction
                                        .getDefaultResources()
                                        .setModuleInstanceId(existingModuleInstance.getId());
                                simulatedNewAction
                                        .getUnpublishedAction()
                                        .getDefaultResources()
                                        .setCollectionId(existingActionCollection.getId());
                                simulatedNewAction
                                        .getUnpublishedAction()
                                        .getDefaultResources()
                                        .setModuleInstanceId(existingModuleInstance.getId());
                                return simulatedNewAction;
                            })
                            .collectList()
                            .flatMapMany(newActionService::saveAll)
                            .mapNotNull(NewAction::getId)
                            .collect(Collectors.toSet());

                    copyNestedNonNullProperties(simulatedActionCollectionDTO, existingActionCollectionDTO);

                    return Mono.zip(updateExistingActionsMono, createSimulatedActionsMono, deleteExistingActionsMono)
                            .map(tuple3 -> {
                                Set<String> createdActionIds = tuple3.getT2();
                                Set<String> deletedActionIds = tuple3.getT3();

                                if (!createdActionIds.isEmpty()) {
                                    Map<String, String> defaultToBranchedActionIdsMap =
                                            existingActionCollectionDTO.getDefaultToBranchedActionIdsMap();
                                    createdActionIds.forEach(createdActionId ->
                                            defaultToBranchedActionIdsMap.put(createdActionId, createdActionId));
                                }

                                if (!deletedActionIds.isEmpty()) {
                                    Map<String, String> defaultToBranchedActionIdsMap =
                                            existingActionCollectionDTO.getDefaultToBranchedActionIdsMap();
                                    Set<String> toDeleteIds = new HashSet<>();
                                    defaultToBranchedActionIdsMap.entrySet().stream()
                                            .forEach(entry -> {
                                                if (createdActionIds.contains(entry.getValue())) {
                                                    toDeleteIds.add(entry.getKey());
                                                }
                                            });
                                    toDeleteIds.forEach(defaultToBranchedActionIdsMap::remove);
                                }

                                return existingActionCollection;
                            });
                })
                .flatMap(actionCollection -> actionCollectionService.update(actionCollection.getId(), actionCollection))
                .then(Mono.just(true));

        Mono<Boolean> deleteExistingCollectionsMono = Flux.fromIterable(toBeRemovedOriginCollectionIds)
                .mapNotNull(toBeRemovedOriginCollectionId -> {
                    ActionCollection actionCollection =
                            originCollectionIdToExistingCollectionMap.get(toBeRemovedOriginCollectionId);
                    return actionCollection.getId();
                })
                .flatMap(actionCollectionService::deleteWithoutPermissionUnpublishedActionCollection)
                .collectList()
                .thenReturn(true);

        Mono<Boolean> createSimulatedCollectionsMono = Flux.fromIterable(toBeAddedOriginCollectionIds)
                .flatMap(toBeAddedOriginCollectionId -> {
                    ActionCollection simulatedActionCollection =
                            originCollectionIdToSimulatedCollectionMap.get(toBeAddedOriginCollectionId);
                    simulatedActionCollection.setRootModuleInstanceId(existingModuleInstance.getId());
                    simulatedActionCollection.setModuleInstanceId(existingModuleInstance.getId());
                    List<NewAction> newActionsToSave = originCollectionIdToSimulatedJSActionsMap.get(
                            simulatedActionCollection.getOriginActionCollectionId());
                    return Flux.fromIterable(newActionsToSave)
                            .map(newAction -> {
                                newAction.setRootModuleInstanceId(existingModuleInstance.getRootModuleInstanceId());
                                newAction.setModuleInstanceId(existingModuleInstance.getId());
                                DefaultResources defaultResources = newAction.getDefaultResources();
                                defaultResources.setModuleInstanceId(existingModuleInstance.getId());
                                newAction.setDefaultResources(defaultResources);
                                newAction.getUnpublishedAction().setDefaultResources(defaultResources);
                                return newAction;
                            })
                            .collectList()
                            .flatMapMany(newActionService::saveAll)
                            .collectList()
                            .then(Mono.just(simulatedActionCollection));
                })
                .collectList()
                .flatMapMany(actionCollectionService::saveAll)
                .then(Mono.just(true));

        return Mono.zip(updateExistingCollectionsMono, deleteExistingCollectionsMono, createSimulatedCollectionsMono)
                .thenReturn(true);
    }
}
