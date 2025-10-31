package com.appsmith.server.actioncollections.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_JSOBJECT;
import static com.appsmith.external.constants.spans.RefactorSpan.AST_REPLACE_VALUE_IN_MUSTACHE;
import static com.appsmith.external.constants.spans.RefactorSpan.COLLECTION_GET_EXISTING_NAMES;
import static com.appsmith.external.constants.spans.RefactorSpan.COLLECTION_REFACTOR_NAME_IN_COLLECTION;
import static com.appsmith.external.constants.spans.RefactorSpan.COLLECTION_REFACTOR_REFERENCES;
import static com.appsmith.external.constants.spans.RefactorSpan.COLLECTION_SAVE;
import static com.appsmith.external.constants.spans.RefactorSpan.COLLECTION_UPDATE_ACTIONS_FQN;
import static com.appsmith.external.constants.spans.RefactorSpan.COLLECTION_UPDATE_REFACTORED;

@Slf4j
@RequiredArgsConstructor
public class ActionCollectionRefactoringServiceCEImpl implements EntityRefactoringServiceCE<ActionCollection> {

    protected final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final AstService astService;
    protected final ObservationRegistry observationRegistry;

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_JSOBJECT;
    }

    @Override
    public Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        Set<String> updatableCollectionIds = refactoringMetaDTO.getUpdatableCollectionIds();
        Mono<Integer> evalVersionMono = refactoringMetaDTO.getEvalVersionMono();
        Pattern oldNamePattern = refactoringMetaDTO.getOldNamePattern();

        String oldName = refactorEntityNameDTO.getOldFullyQualifiedName();
        String newName = refactorEntityNameDTO.getNewFullyQualifiedName();

        log.debug(
                "Starting action collection refactoring: oldName={}, newName={}, collectionsToUpdate={}",
                oldName,
                newName,
                updatableCollectionIds.size());

        Mono<List<ActionCollection>> actionCollectionsMono = evalVersionMono.flatMap(evalVersion -> Flux.fromIterable(
                        updatableCollectionIds)
                .flatMap(collectionId ->
                        actionCollectionService.findById(collectionId, actionPermission.getEditPermission()))
                .flatMap(actionCollection -> {
                    final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                    return this.refactorNameInActionCollection(
                                    unpublishedCollection, oldName, newName, evalVersion, oldNamePattern)
                            .name(COLLECTION_REFACTOR_NAME_IN_COLLECTION)
                            .tap(Micrometer.observation(observationRegistry))
                            .flatMap(isPresent -> {
                                if (Boolean.TRUE.equals(isPresent)) {
                                    log.debug("Saving updated action collection: {}", unpublishedCollection.getName());
                                    return actionCollectionService
                                            .save(actionCollection)
                                            .name(COLLECTION_SAVE)
                                            .tap(Micrometer.observation(observationRegistry));
                                }
                                return Mono.just(actionCollection);
                            });
                })
                .collectList());

        return actionCollectionsMono
                .doOnSuccess(collections -> log.debug("Updated {} action collections", collections.size()))
                .then()
                .name(COLLECTION_REFACTOR_REFERENCES)
                .tap(Micrometer.observation(observationRegistry));
    }

    protected Mono<Boolean> refactorNameInActionCollection(
            ActionCollectionDTO unpublishedCollection,
            String oldName,
            String newName,
            int evalVersion,
            Pattern oldNamePattern) {
        log.debug(
                "Refactoring name in action collection: collectionName={}, oldName={}, newName={}",
                unpublishedCollection.getName(),
                oldName,
                newName);

        return astService
                .replaceValueInMustacheKeys(
                        new HashSet<>(Collections.singletonList(
                                new MustacheBindingToken(unpublishedCollection.getBody(), 0, false))),
                        oldName,
                        newName,
                        evalVersion,
                        oldNamePattern,
                        true)
                .name(AST_REPLACE_VALUE_IN_MUSTACHE)
                .tap(Micrometer.observation(observationRegistry))
                .map(replacedMap -> {
                    Optional<String> replacedValue =
                            replacedMap.values().stream().findFirst();
                    // This value should always be there
                    if (replacedValue.isPresent()) {
                        unpublishedCollection.setBody(replacedValue.get());
                        log.debug("Updated action collection body: {}", unpublishedCollection.getName());
                    }
                    return replacedValue.isPresent();
                });
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO) {
        String newName = refactorEntityNameDTO.getNewName();
        String actionCollectionId = refactorEntityNameDTO.getActionCollectionId();

        log.debug("Updating refactored action collection: collectionId={}, newName={}", actionCollectionId, newName);

        Mono<ActionCollectionDTO> branchedActionCollectionDTOMono;
        branchedActionCollectionDTOMono = actionCollectionService.findActionCollectionDTObyIdAndViewMode(
                actionCollectionId, false, actionPermission.getEditPermission());

        return branchedActionCollectionDTOMono
                .flatMap(branchedActionCollection -> {
                    Flux<ActionDTO> actionUpdatesFlux = newActionService
                            .findByCollectionIdAndViewMode(
                                    branchedActionCollection.getId(), false, actionPermission.getEditPermission())
                            .map(action -> newActionService.generateActionByViewMode(action, false))
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
                            })
                            .name(COLLECTION_UPDATE_ACTIONS_FQN)
                            .tap(Micrometer.observation(observationRegistry));

                    branchedActionCollection.setName(newName);
                    return actionUpdatesFlux.then(
                            actionCollectionService.update(branchedActionCollection.getId(), branchedActionCollection));
                })
                .doOnSuccess(v -> log.debug("Successfully updated action collection: {}", newName))
                .then()
                .name(COLLECTION_UPDATE_REFACTORED)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Flux<String> getExistingEntityNames(
            String contextId, CreatorContextType contextType, String layoutId, boolean viewMode) {
        log.debug("Getting existing action collection entity names for contextId: {}", contextId);
        return getExistingEntities(contextId, contextType, layoutId, viewMode)
                .map(ActionCollectionDTO::getName)
                .name(COLLECTION_GET_EXISTING_NAMES)
                .tap(Micrometer.observation(observationRegistry));
    }

    protected Flux<ActionCollectionDTO> getExistingEntities(
            String contextId, CreatorContextType contextType, String layoutId, boolean viewMode) {
        return actionCollectionService.getCollectionsByPageIdAndViewMode(contextId, viewMode, null);
    }
}
