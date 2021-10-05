package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorActionCollectionNameDTO;
import com.appsmith.server.dtos.RefactorActionNameInCollectionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.BeanCopyUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static java.util.stream.Collectors.toSet;

@Service
@Slf4j
@RequiredArgsConstructor
public class LayoutCollectionServiceImpl implements LayoutCollectionService {

    private final NewPageService newPageService;
    private final LayoutActionService layoutActionService;
    private final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;
    private final AnalyticsService analyticsService;

    /**
     * Called by ActionCollection controller to create ActionCollection
     */
    @Override
    public Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collection) {
        if (collection.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        final Set<String> validationMessages = collection.validate();
        if (!validationMessages.isEmpty()) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_ACTION_COLLECTION,
                    collection.getName(),
                    validationMessages.toString()));
        }

        final String pageId = collection.getPageId();
        Mono<NewPage> pageMono = newPageService
                .findById(pageId, MANAGE_PAGES)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                .cache();

        // First check if the collection name is allowed
        // If the collection name is unique, the action name will be guaranteed to be unique within that collection
        return pageMono
                .flatMap(page -> {
                    Layout layout = page.getUnpublishedPage().getLayouts().get(0);
                    // Check against widget names and action names
                    return layoutActionService.isNameAllowed(page.getId(), layout.getId(), collection.getName());
                })
                .flatMap(isNameAllowed -> {
                    // If the name is allowed, return list of actionDTOs for further processing
                    if (Boolean.TRUE.equals(isNameAllowed)) {
                        return Mono.justOrEmpty(collection.getActions()).defaultIfEmpty(List.of());
                    }
                    // Throw an error since the new action collection's name matches an existing action, widget or collection name.
                    return Mono.error(new AppsmithException(
                            AppsmithError.DUPLICATE_KEY_USER_ERROR,
                            collection.getName(),
                            FieldName.NAME));
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(action -> {
                    if (action.getId() == null) {
                        // Make sure that the proper values are used for the new action
                        // Scope the actions' fully qualified names by collection name
                        action.getDatasource().setOrganizationId(collection.getOrganizationId());
                        action.getDatasource().setPluginId(collection.getPluginId());
                        action.getDatasource().setName(FieldName.UNUSED_DATASOURCE);
                        action.setFullyQualifiedName(collection.getName() + "." + action.getName());
                        action.setPageId(collection.getPageId());
                        action.setPluginType(collection.getPluginType());
                        // Action doesn't exist. Create now.
                        return layoutActionService
                                .createSingleAction(action)
                                // return an empty action so that this action is disregarded from the list
                                .onErrorResume(throwable -> {
                                    log.debug("Failed to create action with name {} for collection: {}", action.getName(), collection.getName());
                                    log.error(throwable.getMessage());
                                    return Mono.empty();
                                });
                    }
                    // actionCollectionService would occur when the new collection is created by grouping existing actions
                    // actionCollectionService could be a future enhancement for js editor templates,
                    // but is also useful for generic collections
                    // We do not expect to have to update the action at actionCollectionService point
                    return Mono.just(action);
                })
                .collectList()
                .zipWith(pageMono)
                .flatMap(tuple -> {
                    final List<ActionDTO> actions = tuple.getT1();
                    final NewPage newPage = tuple.getT2();

                    ActionCollection actionCollection = new ActionCollection();
                    actionCollection.setApplicationId(collection.getApplicationId());
                    actionCollection.setOrganizationId(collection.getOrganizationId());
                    actionCollection.setUnpublishedCollection(collection);
                    actionCollectionService.generateAndSetPolicies(newPage, actionCollection);

                    final Set<String> actionIds = actions
                            .stream()
                            .map(ActionDTO::getId)
                            .collect(toSet());
                    collection.setActionIds(actionIds);

                    // Create collection and return with actions
                    final Mono<ActionCollection> actionCollectionMono = actionCollectionService
                            .create(actionCollection)
                            .cache();
                    return actionCollectionMono
                            .map(actionCollection1 -> {
                                actions.forEach(actionDTO -> {
                                    // Update all the actions in the list to belong to actionCollectionService collection
                                    actionDTO.setCollectionId(actionCollection1.getId());
                                });
                                return actions;
                            })
                            .flatMapMany(Flux::fromIterable)
                            .flatMap(action -> layoutActionService.updateSingleAction(action.getId(), action))
                            .collectList()
                            .zipWith(actionCollectionMono)
                            .flatMap(tuple1 -> {
                                final List<ActionDTO> actionDTOList = tuple1.getT1();
                                final ActionCollection actionCollection1 = tuple1.getT2();
                                return actionCollectionService.generateActionCollectionByViewMode(actionCollection, false)
                                        .flatMap(actionCollectionDTO ->
                                                actionCollectionService.splitValidActionsByViewMode(
                                                        actionCollection1.getUnpublishedCollection(),
                                                        actionDTOList,
                                                        false));
                            });
                });
    }

    @Override
    public Mono<LayoutDTO> refactorCollectionName(RefactorActionCollectionNameDTO refactorActionCollectionNameDTO) {
        String pageId = refactorActionCollectionNameDTO.getPageId();
        String layoutId = refactorActionCollectionNameDTO.getLayoutId();
        String oldName = refactorActionCollectionNameDTO.getOldName();
        String newName = refactorActionCollectionNameDTO.getNewName();
        String actionCollectionId = refactorActionCollectionNameDTO.getActionCollectionId();

        return layoutActionService
                .isNameAllowed(pageId, layoutId, newName)
                .flatMap(isNameAllowed -> {
                    // If the name is allowed, return list of actionDTOs for further processing
                    if (Boolean.TRUE.equals(isNameAllowed)) {
                        return actionCollectionService
                                .findActionCollectionDTObyIdAndViewMode(actionCollectionId, false, MANAGE_ACTIONS);
                    }
                    // Throw an error since the new action collection's name matches an existing action, widget or collection name.
                    return Mono.error(new AppsmithException(
                            AppsmithError.DUPLICATE_KEY_USER_ERROR,
                            newName,
                            FieldName.NAME));
                })
                .flatMap(actionCollection -> {
                    final Set<String> actionIds = new HashSet<>();
                    if (actionCollection.getActionIds() != null) {
                        actionIds.addAll(actionCollection.getActionIds());
                    }
                    if (actionCollection.getArchivedActionIds() != null) {
                        actionIds.addAll(actionCollection.getArchivedActionIds());
                    }

                    Flux<ActionDTO> actionUpdatesFlux = Flux
                            .fromIterable(actionIds)
                            .flatMap(actionId -> newActionService.findActionDTObyIdAndViewMode(actionId, false, MANAGE_ACTIONS))
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
                    actionCollection.setName(newName);
                    return actionUpdatesFlux
                            .collectList()
                            .flatMap(actionDTOs -> actionCollectionService.update(actionCollectionId, actionCollection))
                            .flatMap(actionCollectionDTO -> layoutActionService.refactorName(pageId, layoutId, oldName, newName));
                });
    }

    @Override
    public Mono<ActionCollectionDTO> moveCollection(ActionCollectionMoveDTO actionCollectionMoveDTO) {
        final String collectionId = actionCollectionMoveDTO.getCollectionId();
        final String destinationPageId = actionCollectionMoveDTO.getDestinationPageId();

        return actionCollectionService
                .findActionCollectionDTObyIdAndViewMode(collectionId, false, MANAGE_ACTIONS)
                .flatMap(actionCollection -> {
                    final Set<String> actionIds = new HashSet<>();
                    if (actionCollection.getActionIds() != null) {
                        actionIds.addAll(actionCollection.getActionIds());
                    }
                    if (actionCollection.getArchivedActionIds() != null) {
                        actionIds.addAll(actionCollection.getArchivedActionIds());
                    }

                    final Flux<ActionDTO> actionUpdatesFlux = Flux.fromIterable(actionIds)
                            .flatMap(actionId -> newActionService.findActionDTObyIdAndViewMode(actionId, false, MANAGE_ACTIONS))
                            .flatMap(actionDTO -> {
                                actionDTO.setPageId(destinationPageId);
                                return newActionService.updateUnpublishedAction(actionDTO.getId(), actionDTO)
                                        .onErrorResume(throwable -> {
                                            log.debug("Failed to update collection name for action {} for collection with id: {}", actionDTO.getName(), actionDTO.getCollectionId());
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        });
                            });

                    final String oldPageId = actionCollection.getPageId();
                    actionCollection.setPageId(destinationPageId);

                    return actionUpdatesFlux
                            .collectList()
                            .flatMap(actionDTOs -> actionCollectionService.update(collectionId, actionCollection))
                            .zipWith(Mono.just(oldPageId));
                })
                .flatMap(tuple -> {
                    final ActionCollectionDTO savedCollection = tuple.getT1();
                    final String oldPageId = tuple.getT2();

                    return newPageService
                            .findPageById(oldPageId, MANAGE_PAGES, false)
                            .flatMap(page -> {
                                if (page.getLayouts() == null) {
                                    return Mono.empty();
                                }

                                // 2. Run updateLayout on the old page
                                return Flux.fromIterable(page.getLayouts())
                                        .flatMap(layout -> {
                                            layout.setDsl(layoutActionService.unescapeMongoSpecialCharacters(layout));
                                            return layoutActionService.updateLayout(page.getId(), layout.getId(), layout);
                                        })
                                        .collect(toSet());
                            })
                            // fetch the unpublished destination page
                            .then(newPageService.findPageById(actionCollectionMoveDTO.getDestinationPageId(), MANAGE_PAGES, false))
                            .flatMap(page -> {
                                if (page.getLayouts() == null) {
                                    return Mono.empty();
                                }

                                // 3. Run updateLayout on the new page.
                                return Flux.fromIterable(page.getLayouts())
                                        .flatMap(layout -> {
                                            layout.setDsl(layoutActionService.unescapeMongoSpecialCharacters(layout));
                                            return layoutActionService.updateLayout(page.getId(), layout.getId(), layout);
                                        })
                                        .collect(toSet());
                            })
                            // 4. Return the saved action.
                            .thenReturn(savedCollection);
                });
    }


    @Override
    public Mono<ActionCollectionDTO> updateUnpublishedActionCollection(String id, ActionCollectionDTO actionCollectionDTO) {
        // new actions without ids are to be created
        // new actions with ids are to be updated and added to collection
        // old actions that are now missing are to be archived
        // rest are to be updated
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<ActionCollection> actionCollectionMono = actionCollectionService.findById(id, MANAGE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
                .cache();

        final Set<String> validActionIds = actionCollectionDTO
                .getActions()
                .stream()
                .map(ActionDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
        final Set<String> archivedActionIds = actionCollectionDTO
                .getArchivedActions()
                .stream()
                .map(ActionDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
        final Set<String> actionIds = new HashSet<>();
        actionIds.addAll(validActionIds);
        actionIds.addAll(archivedActionIds);

        final Mono<Set<String>> newValidActionIdsMono = Mono.just(actionCollectionDTO)
                .map(ActionCollectionDTO::getActions)
                .flatMapMany(Flux::fromIterable)
                .flatMap(actionDTO -> {
                    actionDTO.setArchivedAt(null);
                    if (actionDTO.getId() == null) {
                        actionDTO.setCollectionId(id);
                        actionDTO.getDatasource().setOrganizationId(actionCollectionDTO.getOrganizationId());
                        actionDTO.getDatasource().setPluginId(actionCollectionDTO.getPluginId());
                        actionDTO.getDatasource().setName(FieldName.UNUSED_DATASOURCE);
                        actionDTO.setFullyQualifiedName(actionCollectionDTO.getName() + "." + actionDTO.getName());
                        actionDTO.setPageId(actionCollectionDTO.getPageId());
                        actionDTO.setPluginType(actionCollectionDTO.getPluginType());
                        actionDTO.setPluginId(actionCollectionDTO.getPluginId());
                        // actionCollectionService is a new action, we need to create one
                        return layoutActionService.createSingleAction(actionDTO);
                    } else {
                        actionDTO.setCollectionId(null);
                        return layoutActionService.updateSingleAction(actionDTO.getId(), actionDTO);
                    }
                })
                .map(ActionDTO::getId)
                .collect(Collectors.toSet());

        final Mono<Set<String>> newArchivedActionIdsMono = Mono.just(actionCollectionDTO)
                .map(ActionCollectionDTO::getArchivedActions)
                .flatMapMany(Flux::fromIterable)
                .flatMap(actionDTO -> {
                    actionDTO.setCollectionId(id);
                    actionDTO.setArchivedAt(Instant.now());
                    if (actionDTO.getId() == null) {
                        actionDTO.getDatasource().setOrganizationId(actionCollectionDTO.getOrganizationId());
                        actionDTO.getDatasource().setPluginId(actionCollectionDTO.getPluginId());
                        actionDTO.getDatasource().setName(FieldName.UNUSED_DATASOURCE);
                        actionDTO.setFullyQualifiedName(actionCollectionDTO.getName() + "." + actionDTO.getName());
                        actionDTO.setPageId(actionCollectionDTO.getPageId());
                        // actionCollectionService is a new action, we need to create one
                        return layoutActionService.createSingleAction(actionDTO)
                                // return an empty action so that the filter can remove it from the list
                                .onErrorResume(throwable -> {
                                    log.debug("Failed to create action with name {} for collection: {}", actionDTO.getName(), actionCollectionDTO.getName());
                                    log.error(throwable.getMessage());
                                    return Mono.empty();
                                });
                    } else {
                        return layoutActionService.updateSingleAction(actionDTO.getId(), actionDTO);
                    }
                })
                .map(ActionDTO::getId)
                .collect(Collectors.toSet());
        // First collect all valid action ids from before, and diff against incoming action ids
        return actionCollectionMono
                .map(actionCollection -> {
                    // From the existing collection, if an action id is not referenced at all anymore,
                    // this means the action has been somehow deleted
                    final Set<String> oldActionIds = new HashSet<>();
                    if (actionCollection.getUnpublishedCollection().getActionIds() != null) {
                        oldActionIds.addAll(actionCollection
                                .getUnpublishedCollection()
                                .getActionIds());
                    }
                    if (actionCollection.getUnpublishedCollection().getArchivedActionIds() != null) {
                        oldActionIds.addAll(actionCollection
                                .getUnpublishedCollection()
                                .getArchivedActionIds());
                    }

                    return oldActionIds
                            .stream()
                            .filter(Objects::nonNull)
                            .filter(x -> !actionIds.contains(x))
                            .collect(Collectors.toUnmodifiableSet());
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(actionId -> newActionService.deleteUnpublishedAction(actionId)
                        // return an empty action so that the filter can remove it from the list
                        .onErrorResume(throwable -> {
                            log.debug("Failed to delete action with id {} for collection: {}", actionId, actionCollectionDTO.getName());
                            log.error(throwable.getMessage());
                            return Mono.empty();
                        }))
                .then(Mono.zip(newValidActionIdsMono, newArchivedActionIdsMono))
                .flatMap(tuple -> {
                    actionCollectionDTO.setActionIds(tuple.getT1());
                    actionCollectionDTO.setArchivedActionIds(tuple.getT2());
                    return actionCollectionMono
                            .map(dbActionCollection -> {
                                copyNewFieldValuesIntoOldObject(actionCollectionDTO, dbActionCollection.getUnpublishedCollection());
                                return dbActionCollection;
                            });
                })
                .flatMap(actionCollection -> actionCollectionService.update(id, actionCollection))
                .flatMap(analyticsService::sendUpdateEvent)
                .flatMap(actionCollection -> actionCollectionService.generateActionCollectionByViewMode(actionCollection, false)
                        .flatMap(actionCollectionDTO1 -> actionCollectionService.populateActionCollectionByViewMode(
                                actionCollection.getUnpublishedCollection(),
                                false)));
    }

    @Override
    public Mono<LayoutDTO> refactorAction(RefactorActionNameInCollectionDTO refactorActionNameInCollectionDTO) {
        // First perform refactor of the action itself
        final Mono<LayoutDTO> layoutDTOMono = layoutActionService
                .refactorActionName(refactorActionNameInCollectionDTO.getRefactorAction())
                .cache();

        final ActionCollectionDTO actionCollectionDTO = refactorActionNameInCollectionDTO.getActionCollection();
        Mono<ActionCollection> actionCollectionMono = actionCollectionService.findById(actionCollectionDTO.getId(), MANAGE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, actionCollectionDTO.getId())));

        return layoutDTOMono
                .then(actionCollectionMono)
                .map(dbActionCollection -> {
                    // Make sure that the action related fields and name are not edited
                    actionCollectionDTO.setName(dbActionCollection.getUnpublishedCollection().getName());
                    actionCollectionDTO.setActionIds(dbActionCollection.getUnpublishedCollection().getActionIds());
                    actionCollectionDTO.setArchivedActionIds(dbActionCollection.getUnpublishedCollection().getArchivedActionIds());
                    copyNewFieldValuesIntoOldObject(actionCollectionDTO, dbActionCollection.getUnpublishedCollection());
                    return dbActionCollection;
                })
                .flatMap(actionCollection -> actionCollectionService.update(actionCollectionDTO.getId(), actionCollection))
                .then(layoutDTOMono);
    }
}
