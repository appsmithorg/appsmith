package com.appsmith.server.actioncollections.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_JSOBJECT;

@Slf4j
@RequiredArgsConstructor
public class ActionCollectionRefactoringServiceCEImpl implements EntityRefactoringServiceCE<ActionCollection> {

    private final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;
    private final ActionPermission actionPermission;

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_JSOBJECT;
    }

    @Override
    public Mono<Boolean> validateName(String name) {
        return Mono.just(Boolean.TRUE);
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName) {
        String newName = refactorEntityNameDTO.getNewName();
        String actionCollectionId = refactorEntityNameDTO.getActionCollectionId();

        Mono<ActionCollectionDTO> branchedActionCollectionDTOMono = StringUtils.isEmpty(branchName)
                ? actionCollectionService.findActionCollectionDTObyIdAndViewMode(
                        actionCollectionId, false, actionPermission.getEditPermission())
                : actionCollectionService
                        .findByBranchNameAndDefaultCollectionId(
                                branchName, actionCollectionId, actionPermission.getEditPermission())
                        .flatMap(actionCollection ->
                                actionCollectionService.generateActionCollectionByViewMode(actionCollection, false));

        return branchedActionCollectionDTOMono
                .flatMap(branchedActionCollection -> {
                    final HashMap<String, String> actionIds = new HashMap<>();
                    if (branchedActionCollection.getDefaultToBranchedActionIdsMap() != null) {
                        actionIds.putAll(branchedActionCollection.getDefaultToBranchedActionIdsMap());
                    }
                    if (branchedActionCollection.getDefaultToBranchedArchivedActionIdsMap() != null) {
                        actionIds.putAll(branchedActionCollection.getDefaultToBranchedArchivedActionIdsMap());
                    }

                    Flux<ActionDTO> actionUpdatesFlux = Flux.fromIterable(actionIds.values())
                            .flatMap(actionId -> newActionService.findActionDTObyIdAndViewMode(
                                    actionId, false, actionPermission.getEditPermission()))
                            .flatMap(actionDTO -> {
                                actionDTO.setFullyQualifiedName(newName + "." + actionDTO.getName());
                                return newActionService
                                        .updateUnpublishedAction(actionDTO.getId(), actionDTO)
                                        .onErrorResume(throwable -> {
                                            log.debug(
                                                    "Failed to update collection name for action {} for collection with id: {}",
                                                    actionDTO.getName(),
                                                    actionDTO.getCollectionId());
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        });
                            });
                    branchedActionCollection.setName(newName);
                    return actionUpdatesFlux.then(
                            actionCollectionService.update(branchedActionCollection.getId(), branchedActionCollection));
                })
                .then();
    }
}
