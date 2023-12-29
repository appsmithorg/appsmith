package com.appsmith.server.newactions.upgrade;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
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
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@RequiredArgsConstructor
@Service
public class NewActionPackageUpgradableServiceImpl implements PackageUpgradableService<NewAction> {

    private final NewActionService newActionService;

    @Override
    public Mono<Boolean> getUpgradableEntitiesReferences(PackagePublishingMetaDTO publishingMetaDTO) {

        return Flux.fromIterable(publishingMetaDTO
                        .getExistingModuleInstanceIdToModuleInstanceMap()
                        .keySet())
                .flatMap(moduleInstanceId -> newActionService
                        .findAllUnpublishedComposedActionsByRootModuleInstanceId(moduleInstanceId, null, false)
                        .collect(Collectors.partitioningBy(newAction -> newAction.getOriginActionId() == null))
                        .doOnNext(map -> {
                            // We have partitioned all existing composed actions on the basis of origin id
                            // An action that does not have origin id is an orphan public entity that needs to be
                            // deleted post-upgrade.
                            // Hence, we record both these kinds of actions in separate maps

                            if (map.containsKey(false)) {
                                // These actions are valid
                                List<NewAction> newActions = map.get(false);
                                storeValidActions(publishingMetaDTO, moduleInstanceId, newActions);
                            }

                            if (map.containsKey(true)) {
                                // These actions are invalid
                                List<NewAction> invalidActions = map.get(true);
                                storeInvalidActions(publishingMetaDTO, moduleInstanceId, invalidActions);
                            }
                        }))
                .collectList()
                .thenReturn(true);
    }

    private void storeInvalidActions(
            PackagePublishingMetaDTO publishingMetaDTO, String moduleInstanceId, List<NewAction> invalidActions) {
        Map<String, NewAction> invalidFQNToActionMap = invalidActions.stream()
                .collect(Collectors.toMap(
                        newAction -> newAction.getUnpublishedAction().getFullyQualifiedName(), newAction -> newAction));

        publishingMetaDTO
                .getExistingInvalidComposedActionRefToNewActionMap()
                .put(moduleInstanceId, invalidFQNToActionMap);
    }

    private void storeValidActions(
            PackagePublishingMetaDTO publishingMetaDTO, String moduleInstanceId, List<NewAction> newActions) {
        Map<String, NewAction> validOriginIdToActionMap =
                newActions.stream().collect(Collectors.toMap(NewAction::getOriginActionId, newAction -> newAction));

        publishingMetaDTO.getExistingComposedActionRefToNewActionMap().put(moduleInstanceId, validOriginIdToActionMap);
    }

    @Override
    public Mono<Boolean> updateExistingEntities(
            ModuleInstance existingModuleInstance,
            SimulatedModuleInstanceDTO simulatedModuleInstanceDTO,
            PackagePublishingMetaDTO publishingMetaDTO) {
        Map<String, NewAction> originActionIdToExistingActionMap =
                publishingMetaDTO.getExistingComposedActionRefToNewActionMap().get(existingModuleInstance.getId());

        Map<String, NewAction> invalidActionFQNToExistingActionMap = publishingMetaDTO
                .getExistingInvalidComposedActionRefToNewActionMap()
                .get(existingModuleInstance.getId());

        Set<String> invalidActionIds = invalidActionFQNToExistingActionMap.values().stream()
                .map(NewAction::getId)
                .collect(Collectors.toSet());

        Map<String, NewAction> originActionIdToSimulatedActionMap =
                simulatedModuleInstanceDTO.getOriginToNewActionMap();

        HashSet<String> toBeRemovedOriginActionIds = new HashSet<>(originActionIdToExistingActionMap.keySet());
        toBeRemovedOriginActionIds.removeAll(originActionIdToSimulatedActionMap.keySet());

        HashSet<String> toBeAddedOriginActionIds = new HashSet<>(originActionIdToSimulatedActionMap.keySet());
        toBeAddedOriginActionIds.removeAll(originActionIdToExistingActionMap.keySet());

        HashSet<String> toBeUpdatedOriginActionIds = new HashSet<>(originActionIdToSimulatedActionMap.keySet());
        toBeUpdatedOriginActionIds.retainAll(originActionIdToExistingActionMap.keySet());

        Mono<Boolean> updateExistingActionsMono = Flux.fromIterable(toBeUpdatedOriginActionIds)
                .map(toBeUpdatedOriginActionId -> {
                    NewAction existingNewAction = originActionIdToExistingActionMap.get(toBeUpdatedOriginActionId);
                    NewAction simulatedNewAction = originActionIdToSimulatedActionMap.get(toBeUpdatedOriginActionId);
                    ActionDTO simulatedActionDTO = simulatedNewAction.getUnpublishedAction();
                    ActionDTO existingActionDTO = existingNewAction.getUnpublishedAction();

                    if (Boolean.TRUE.equals(simulatedNewAction.getIsPublic())) {
                        // Retain specific properties from the old public action
                        simulatedActionDTO.setExecuteOnLoad(existingActionDTO.getExecuteOnLoad());
                        simulatedActionDTO.setUserSetOnLoad(existingActionDTO.getUserSetOnLoad());
                        simulatedActionDTO.setConfirmBeforeExecute(existingActionDTO.getConfirmBeforeExecute());
                    }

                    copyNestedNonNullProperties(simulatedActionDTO, existingActionDTO);
                    return existingNewAction;
                })
                .collectList()
                .flatMapMany(newActionService::saveAll)
                .then(Mono.just(true));

        Mono<Boolean> deleteExistingActionsMono = Flux.fromIterable(toBeRemovedOriginActionIds)
                .mapNotNull(toBeRemovedOriginActionId -> {
                    NewAction existingNewAction = originActionIdToExistingActionMap.get(toBeRemovedOriginActionId);
                    return existingNewAction.getId();
                })
                .concatWith(Flux.fromIterable(invalidActionIds))
                .flatMap(newActionService::deleteUnpublishedAction)
                .then(Mono.just(true));

        Mono<Boolean> createSimulatedActionsMono = Flux.fromIterable(toBeAddedOriginActionIds)
                .mapNotNull(toBeAddedOriginActionId -> {
                    NewAction simulatedNewAction = originActionIdToSimulatedActionMap.get(toBeAddedOriginActionId);
                    simulatedNewAction.setRootModuleInstanceId(existingModuleInstance.getId());
                    simulatedNewAction.setModuleInstanceId(existingModuleInstance.getId());
                    simulatedNewAction
                            .getUnpublishedAction()
                            .getDefaultResources()
                            .setModuleInstanceId(existingModuleInstance.getId());

                    String fullyQualifiedName =
                            simulatedNewAction.getUnpublishedAction().getFullyQualifiedName();

                    // In case this action had been present as an invalid action, copy its properties as well
                    if (invalidActionFQNToExistingActionMap.containsKey(fullyQualifiedName)) {
                        NewAction existingInvalidAction = invalidActionFQNToExistingActionMap.get(fullyQualifiedName);

                        simulatedNewAction.setGitSyncId(existingInvalidAction.getGitSyncId());

                        ActionDTO simulatedActionDTO = simulatedNewAction.getUnpublishedAction();
                        ActionDTO existingActionDTO = existingInvalidAction.getUnpublishedAction();

                        // Retain specific properties from the old public action
                        simulatedActionDTO.setExecuteOnLoad(existingActionDTO.getExecuteOnLoad());
                        simulatedActionDTO.setUserSetOnLoad(existingActionDTO.getUserSetOnLoad());
                        simulatedActionDTO.setConfirmBeforeExecute(existingActionDTO.getConfirmBeforeExecute());
                    }

                    return simulatedNewAction;
                })
                .collectList()
                .flatMapMany(newActionService::saveAll)
                .then(Mono.just(true));

        return Mono.zip(updateExistingActionsMono, deleteExistingActionsMono, createSimulatedActionsMono)
                .thenReturn(true);
    }
}
