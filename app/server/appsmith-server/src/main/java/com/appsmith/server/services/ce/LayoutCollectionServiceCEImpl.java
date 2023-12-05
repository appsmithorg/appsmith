package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
import static java.util.stream.Collectors.toMap;
import static java.util.stream.Collectors.toSet;

@Slf4j
@RequiredArgsConstructor
public class LayoutCollectionServiceCEImpl implements LayoutCollectionServiceCE {

    private final NewPageService newPageService;
    private final LayoutActionService layoutActionService;
    private final UpdateLayoutService updateLayoutService;
    private final RefactoringService refactoringService;
    private final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;
    private final AnalyticsService analyticsService;
    private final ResponseUtils responseUtils;
    private final ActionCollectionRepository actionCollectionRepository;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;

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
                    AppsmithError.INVALID_ACTION_COLLECTION, collection.getName(), validationMessages.toString()));
        }

        DefaultResources defaultResources = collection.getDefaultResources();

        if (defaultResources == null) {
            DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(collection, null);
        }

        final String pageId = collection.getPageId();
        Mono<NewPage> pageMono = newPageService
                .findById(pageId, pagePermission.getActionCreatePermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                .cache();

        // First check if the collection name is allowed
        // If the collection name is unique, the action name will be guaranteed to be unique within that collection
        return pageMono.flatMap(page -> {
                    Layout layout = page.getUnpublishedPage().getLayouts().get(0);
                    CreatorContextType contextType =
                            collection.getContextType() == null ? CreatorContextType.PAGE : collection.getContextType();
                    // Check against widget names and action names
                    return refactoringService.isNameAllowed(
                            page.getId(), contextType, layout.getId(), collection.getName());
                })
                .flatMap(isNameAllowed -> {
                    // If the name is allowed, return list of actionDTOs for further processing
                    if (Boolean.TRUE.equals(isNameAllowed)) {
                        return Mono.justOrEmpty(collection.getActions()).defaultIfEmpty(List.of());
                    }
                    // Throw an error since the new action collection's name matches an existing action, widget or
                    // collection name.
                    return Mono.error(new AppsmithException(
                            AppsmithError.DUPLICATE_KEY_USER_ERROR, collection.getName(), FieldName.NAME));
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(action -> {
                    if (action.getId() == null) {
                        // Make sure that the proper values are used for the new action
                        // Scope the actions' fully qualified names by collection name
                        if (action.getDatasource() == null) {
                            action.autoGenerateDatasource();
                        }
                        action.getDatasource().setWorkspaceId(collection.getWorkspaceId());
                        action.getDatasource().setPluginId(collection.getPluginId());
                        action.getDatasource().setName(FieldName.UNUSED_DATASOURCE);
                        action.setFullyQualifiedName(collection.getName() + "." + action.getName());
                        action.setPageId(collection.getPageId());
                        action.setPluginType(collection.getPluginType());
                        action.setDefaultResources(collection.getDefaultResources());
                        // Action doesn't exist. Create now.
                        return layoutActionService
                                .createSingleAction(action, Boolean.TRUE)
                                // return an empty action so that this action is disregarded from the list
                                .onErrorResume(throwable -> {
                                    log.debug(
                                            "Failed to create action with name {} for collection: {}",
                                            action.getName(),
                                            collection.getName());
                                    log.error(throwable.getMessage());
                                    return Mono.empty();
                                });
                    }
                    // actionCollectionService would occur when the new collection is created by grouping existing
                    // actions
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
                    actionCollection.setWorkspaceId(collection.getWorkspaceId());
                    actionCollection.setUnpublishedCollection(collection);
                    actionCollection.setDefaultResources(collection.getDefaultResources());
                    actionCollectionService.generateAndSetPolicies(newPage, actionCollection);

                    // Store the default resource ids
                    // Only store defaultPageId for collectionDTO level resource
                    DefaultResources defaultDTOResource = new DefaultResources();
                    AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(
                            collection.getDefaultResources(), defaultDTOResource);

                    defaultDTOResource.setApplicationId(null);
                    defaultDTOResource.setCollectionId(null);
                    defaultDTOResource.setBranchName(null);
                    if (StringUtils.isEmpty(defaultDTOResource.getPageId())) {
                        defaultDTOResource.setPageId(collection.getPageId());
                    }
                    collection.setDefaultResources(defaultDTOResource);

                    // Only store branchName, defaultApplicationId and defaultActionCollectionId for ActionCollection
                    // level resource
                    DefaultResources defaults = new DefaultResources();
                    AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(actionCollection.getDefaultResources(), defaults);
                    defaults.setPageId(null);
                    if (StringUtils.isEmpty(defaults.getApplicationId())) {
                        defaults.setApplicationId(actionCollection.getApplicationId());
                    }
                    actionCollection.setDefaultResources(defaults);

                    final Map<String, String> actionIds = actions.stream()
                            .collect(toMap(
                                    actionDTO -> actionDTO.getDefaultResources().getActionId(), ActionDTO::getId));
                    collection.setDefaultToBranchedActionIdsMap(actionIds);

                    if (actionCollection.getGitSyncId() == null) {
                        actionCollection.setGitSyncId(actionCollection.getApplicationId() + "_" + new ObjectId());
                    }
                    // Create collection and return with actions
                    final Mono<ActionCollection> actionCollectionMono = actionCollectionService
                            .create(actionCollection)
                            .flatMap(savedActionCollection -> {
                                // If the default collection is not set then current collection will be the default one
                                if (StringUtils.isEmpty(savedActionCollection
                                        .getDefaultResources()
                                        .getCollectionId())) {
                                    savedActionCollection
                                            .getDefaultResources()
                                            .setCollectionId(savedActionCollection.getId());
                                }
                                return actionCollectionService.save(savedActionCollection);
                            })
                            .flatMap(actionCollectionRepository::setUserPermissionsInObject)
                            .cache();

                    return actionCollectionMono
                            .map(actionCollection1 -> {
                                actions.forEach(actionDTO -> {
                                    // Update all the actions in the list to belong to actionCollectionService
                                    // collection
                                    actionDTO.setCollectionId(actionCollection1.getId());
                                    if (StringUtils.isEmpty(
                                            actionDTO.getDefaultResources().getCollectionId())) {
                                        actionDTO.getDefaultResources().setCollectionId(actionCollection1.getId());
                                    }
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
                                return actionCollectionService
                                        .generateActionCollectionByViewMode(actionCollection, false)
                                        .flatMap(actionCollectionDTO ->
                                                actionCollectionService.splitValidActionsByViewMode(
                                                        actionCollection1.getUnpublishedCollection(),
                                                        actionDTOList,
                                                        false));
                            })
                            .flatMap(updatedCollection -> updateLayoutService
                                    .updatePageLayoutsByPageId(updatedCollection.getPageId())
                                    .thenReturn(updatedCollection));
                });
    }

    @Override
    public Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collection, String branchName) {
        if (collection.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return newPageService
                .findById(collection.getPageId(), pagePermission.getActionCreatePermission())
                .flatMap(newPage -> {
                    // Insert defaultPageId and defaultAppId from page
                    DefaultResources defaultResources = newPage.getDefaultResources();
                    defaultResources.setBranchName(branchName);
                    collection.setDefaultResources(defaultResources);
                    return newPageService.findByBranchNameAndDefaultPageId(
                            branchName, defaultResources.getPageId(), pagePermission.getEditPermission());
                })
                .flatMap(branchedPage -> {
                    // Update the page and application id with branched resource
                    collection.setApplicationId(branchedPage.getApplicationId());
                    collection.setPageId(branchedPage.getId());
                    return createCollection(collection);
                })
                .map(responseUtils::updateCollectionDTOWithDefaultResources);
    }

    @Override
    public Mono<ActionCollectionDTO> moveCollection(ActionCollectionMoveDTO actionCollectionMoveDTO) {
        final String collectionId = actionCollectionMoveDTO.getCollectionId();
        final String destinationPageId = actionCollectionMoveDTO.getDestinationPageId();

        Mono<NewPage> destinationPageMono = newPageService
                .findById(actionCollectionMoveDTO.getDestinationPageId(), pagePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, destinationPageId)))
                .cache();

        return Mono.zip(
                        destinationPageMono,
                        actionCollectionService.findActionCollectionDTObyIdAndViewMode(
                                collectionId, false, actionPermission.getEditPermission()))
                .flatMap(tuple -> {
                    NewPage destinationPage = tuple.getT1();
                    ActionCollectionDTO actionCollectionDTO = tuple.getT2();
                    final Map<String, String> actionIds = new HashMap<>();
                    if (actionCollectionDTO.getDefaultToBranchedActionIdsMap() != null) {
                        actionIds.putAll(actionCollectionDTO.getDefaultToBranchedActionIdsMap());
                    }
                    if (actionCollectionDTO.getDefaultToBranchedArchivedActionIdsMap() != null) {
                        actionIds.putAll(actionCollectionDTO.getDefaultToBranchedArchivedActionIdsMap());
                    }

                    final Flux<ActionDTO> actionUpdatesFlux = Flux.fromIterable(actionIds.values())
                            .flatMap(actionId -> newActionService.findActionDTObyIdAndViewMode(
                                    actionId, false, actionPermission.getEditPermission()))
                            .flatMap(actionDTO -> {
                                actionDTO.setPageId(destinationPageId);
                                // Update default page ID in actions as per destination page object
                                actionDTO
                                        .getDefaultResources()
                                        .setPageId(destinationPage
                                                .getDefaultResources()
                                                .getPageId());
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

                    final String oldPageId = actionCollectionDTO.getPageId();
                    actionCollectionDTO.setPageId(destinationPageId);
                    DefaultResources defaultResources = new DefaultResources();
                    defaultResources.setPageId(
                            destinationPage.getDefaultResources().getPageId());
                    actionCollectionDTO.setDefaultResources(defaultResources);
                    actionCollectionDTO.setName(actionCollectionMoveDTO.getName());

                    return actionUpdatesFlux
                            .collectList()
                            .flatMap(actionDTOs -> actionCollectionService.update(collectionId, actionCollectionDTO))
                            .zipWith(Mono.just(oldPageId));
                })
                .flatMap(tuple -> {
                    final ActionCollectionDTO savedCollection = tuple.getT1();
                    final String oldPageId = tuple.getT2();

                    return newPageService
                            .findPageById(oldPageId, pagePermission.getEditPermission(), false)
                            .flatMap(page -> {
                                if (page.getLayouts() == null) {
                                    return Mono.empty();
                                }

                                // 2. Run updateLayout on the old page
                                return Flux.fromIterable(page.getLayouts())
                                        .flatMap(layout -> {
                                            layout.setDsl(updateLayoutService.unescapeMongoSpecialCharacters(layout));
                                            return updateLayoutService.updateLayout(
                                                    page.getId(), page.getApplicationId(), layout.getId(), layout);
                                        })
                                        .collect(toSet());
                            })
                            // fetch the unpublished destination page
                            .then(newPageService.findPageById(
                                    actionCollectionMoveDTO.getDestinationPageId(),
                                    pagePermission.getActionCreatePermission(),
                                    false))
                            .flatMap(page -> {
                                if (page.getLayouts() == null) {
                                    return Mono.empty();
                                }

                                // 3. Run updateLayout on the new page.
                                return Flux.fromIterable(page.getLayouts())
                                        .flatMap(layout -> {
                                            layout.setDsl(updateLayoutService.unescapeMongoSpecialCharacters(layout));
                                            return updateLayoutService.updateLayout(
                                                    page.getId(), page.getApplicationId(), layout.getId(), layout);
                                        })
                                        .collect(toSet());
                            })
                            // 4. Return the saved action.
                            .thenReturn(savedCollection);
                });
    }

    @Override
    public Mono<ActionCollectionDTO> moveCollection(
            ActionCollectionMoveDTO actionCollectionMoveDTO, String branchName) {

        Mono<String> destinationPageMono = newPageService
                .findByBranchNameAndDefaultPageId(
                        branchName,
                        actionCollectionMoveDTO.getDestinationPageId(),
                        pagePermission.getActionCreatePermission())
                .map(NewPage::getId);

        Mono<String> branchedCollectionMono = actionCollectionService
                .findByBranchNameAndDefaultCollectionId(
                        branchName, actionCollectionMoveDTO.getCollectionId(), actionPermission.getEditPermission())
                .map(ActionCollection::getId);

        return Mono.zip(destinationPageMono, branchedCollectionMono)
                .flatMap(tuple -> {
                    String destinationPageId = tuple.getT1();
                    String branchedCollectionId = tuple.getT2();
                    actionCollectionMoveDTO.setDestinationPageId(destinationPageId);
                    actionCollectionMoveDTO.setCollectionId(branchedCollectionId);
                    return this.moveCollection(actionCollectionMoveDTO);
                })
                .map(responseUtils::updateCollectionDTOWithDefaultResources);
    }

    @Override
    public Mono<ActionCollectionDTO> updateUnpublishedActionCollection(
            String id, ActionCollectionDTO actionCollectionDTO, String branchName) {
        // new actions without ids are to be created
        // new actions with ids are to be updated and added to collection
        // old actions that are now missing are to be archived
        // rest are to be updated
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        final String pageId = actionCollectionDTO.getPageId();

        Mono<ActionCollection> branchedActionCollectionMono = actionCollectionService
                .findByBranchNameAndDefaultCollectionId(branchName, id, actionPermission.getEditPermission())
                .cache();

        // It is expected that client will be aware of defaultActionIds and not the branched (actual) action ID
        final Set<String> validDefaultActionIds = actionCollectionDTO.getActions().stream()
                .map(ActionDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
        final Set<String> archivedDefaultActionIds = actionCollectionDTO.getArchivedActions().stream()
                .map(ActionDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
        final Set<String> defaultActionIds = new HashSet<>();
        defaultActionIds.addAll(validDefaultActionIds);
        defaultActionIds.addAll(archivedDefaultActionIds);

        final Mono<Map<String, String>> newValidActionIdsMono = branchedActionCollectionMono.flatMap(
                branchedActionCollection -> Flux.fromIterable(actionCollectionDTO.getActions())
                        .flatMap(actionDTO -> {
                            actionDTO.setDeletedAt(null);
                            actionDTO.setPageId(branchedActionCollection
                                    .getUnpublishedCollection()
                                    .getPageId());
                            actionDTO.setApplicationId(branchedActionCollection.getApplicationId());
                            if (actionDTO.getId() == null) {
                                actionDTO.setCollectionId(branchedActionCollection.getId());
                                if (actionDTO.getDatasource() == null) {
                                    actionDTO.autoGenerateDatasource();
                                }
                                actionDTO.getDatasource().setWorkspaceId(actionCollectionDTO.getWorkspaceId());
                                actionDTO.getDatasource().setPluginId(actionCollectionDTO.getPluginId());
                                actionDTO.getDatasource().setName(FieldName.UNUSED_DATASOURCE);
                                actionDTO.setFullyQualifiedName(
                                        actionCollectionDTO.getName() + "." + actionDTO.getName());
                                actionDTO.setPluginType(actionCollectionDTO.getPluginType());
                                actionDTO.setPluginId(actionCollectionDTO.getPluginId());
                                actionDTO.setDefaultResources(branchedActionCollection.getDefaultResources());
                                actionDTO.getDefaultResources().setBranchName(branchName);
                                final String defaultPageId = branchedActionCollection
                                        .getUnpublishedCollection()
                                        .getDefaultResources()
                                        .getPageId();
                                actionDTO.getDefaultResources().setPageId(defaultPageId);
                                // actionCollectionService is a new action, we need to create one
                                return layoutActionService.createSingleAction(actionDTO, Boolean.TRUE);
                            } else {
                                actionDTO.setCollectionId(null);
                                // Client only knows about the default action ID, fetch branched action id to update the
                                // action
                                Mono<String> branchedActionIdMono = StringUtils.isEmpty(branchName)
                                        ? Mono.just(actionDTO.getId())
                                        : newActionService
                                                .findByBranchNameAndDefaultActionId(
                                                        branchName,
                                                        actionDTO.getId(),
                                                        actionPermission.getEditPermission())
                                                .map(NewAction::getId);
                                actionDTO.setId(null);
                                return branchedActionIdMono.flatMap(
                                        actionId -> layoutActionService.updateSingleAction(actionId, actionDTO));
                            }
                        })
                        .collect(toMap(
                                actionDTO -> actionDTO.getDefaultResources().getActionId(), ActionDTO::getId)));

        final Mono<Map<String, String>> newArchivedActionIdsMono = branchedActionCollectionMono.flatMap(
                branchedActionCollection -> Flux.fromIterable(actionCollectionDTO.getArchivedActions())
                        .flatMap(actionDTO -> {
                            actionDTO.setCollectionId(branchedActionCollection.getId());
                            actionDTO.setDeletedAt(Instant.now());
                            actionDTO.setPageId(branchedActionCollection
                                    .getUnpublishedCollection()
                                    .getPageId());
                            if (actionDTO.getId() == null) {
                                actionDTO.getDatasource().setWorkspaceId(actionCollectionDTO.getWorkspaceId());
                                actionDTO.getDatasource().setPluginId(actionCollectionDTO.getPluginId());
                                actionDTO.getDatasource().setName(FieldName.UNUSED_DATASOURCE);
                                actionDTO.setFullyQualifiedName(
                                        actionCollectionDTO.getName() + "." + actionDTO.getName());
                                actionDTO.setDefaultResources(branchedActionCollection.getDefaultResources());
                                actionDTO.getDefaultResources().setBranchName(branchName);
                                final String defaultPageId = branchedActionCollection
                                        .getUnpublishedCollection()
                                        .getDefaultResources()
                                        .getPageId();
                                actionDTO.getDefaultResources().setPageId(defaultPageId);
                                // actionCollectionService is a new action, we need to create one
                                return layoutActionService
                                        .createSingleAction(actionDTO, Boolean.TRUE)
                                        // return an empty action so that the filter can remove it from the list
                                        .onErrorResume(throwable -> {
                                            log.debug(
                                                    "Failed to create action with name {} for collection: {}",
                                                    actionDTO.getName(),
                                                    actionCollectionDTO.getName());
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        });
                            } else {
                                // Client only knows about the default action ID, fetch branched action id to update the
                                // action
                                Mono<String> branchedActionIdMono = StringUtils.isEmpty(branchName)
                                        ? Mono.just(actionDTO.getId())
                                        : newActionService
                                                .findByBranchNameAndDefaultActionId(
                                                        branchName,
                                                        actionDTO.getId(),
                                                        actionPermission.getEditPermission())
                                                .map(NewAction::getId);
                                actionDTO.setId(null);
                                return branchedActionIdMono.flatMap(
                                        actionId -> layoutActionService.updateSingleAction(actionId, actionDTO));
                            }
                        })
                        .collect(toMap(
                                actionDTO -> actionDTO.getDefaultResources().getActionId(), ActionDTO::getId)));

        // First collect all valid action ids from before, and diff against incoming action ids
        return branchedActionCollectionMono
                .map(branchedActionCollection -> {
                    // From the existing collection, if an action id is not referenced at all anymore,
                    // this means the action has been somehow deleted
                    final Set<String> oldDefaultActionIds = new HashSet<>();
                    if (branchedActionCollection.getUnpublishedCollection().getDefaultToBranchedActionIdsMap()
                            != null) {
                        oldDefaultActionIds.addAll(branchedActionCollection
                                .getUnpublishedCollection()
                                .getDefaultToBranchedActionIdsMap()
                                .keySet());
                    }
                    if (branchedActionCollection.getUnpublishedCollection().getDefaultToBranchedArchivedActionIdsMap()
                            != null) {
                        oldDefaultActionIds.addAll(branchedActionCollection
                                .getUnpublishedCollection()
                                .getDefaultToBranchedArchivedActionIdsMap()
                                .keySet());
                    }

                    return oldDefaultActionIds.stream()
                            .filter(Objects::nonNull)
                            .filter(x -> !defaultActionIds.contains(x))
                            .collect(Collectors.toUnmodifiableSet());
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(defaultActionId -> newActionService
                        .findBranchedIdByBranchNameAndDefaultActionId(
                                branchName, defaultActionId, actionPermission.getEditPermission())
                        .flatMap(newActionService::deleteUnpublishedAction)
                        // return an empty action so that the filter can remove it from the list
                        .onErrorResume(throwable -> {
                            log.debug(
                                    "Failed to delete action with id {}, branch {} for collection: {}",
                                    defaultActionId,
                                    branchName,
                                    actionCollectionDTO.getName());
                            log.error(throwable.getMessage());
                            return Mono.empty();
                        }))
                .then(Mono.zip(newValidActionIdsMono, newArchivedActionIdsMono))
                .flatMap(tuple -> {
                    actionCollectionDTO.setDefaultToBranchedActionIdsMap(tuple.getT1());
                    actionCollectionDTO.setDefaultToBranchedArchivedActionIdsMap(tuple.getT2());
                    return branchedActionCollectionMono.map(dbActionCollection -> {
                        actionCollectionDTO.setId(null);
                        actionCollectionDTO.setPageId(null);
                        copyNewFieldValuesIntoOldObject(
                                actionCollectionDTO, dbActionCollection.getUnpublishedCollection());
                        return dbActionCollection;
                    });
                })
                .flatMap(actionCollection -> actionCollectionService.update(actionCollection.getId(), actionCollection))
                .flatMap(actionCollectionRepository::setUserPermissionsInObject)
                .flatMap(savedActionCollection -> updateLayoutService
                        .updatePageLayoutsByPageId(
                                savedActionCollection.getUnpublishedCollection().getPageId())
                        .thenReturn(savedActionCollection))
                .flatMap(savedActionCollection -> analyticsService.sendUpdateEvent(
                        savedActionCollection, actionCollectionService.getAnalyticsProperties(savedActionCollection)))
                .flatMap(actionCollection -> actionCollectionService
                        .generateActionCollectionByViewMode(actionCollection, false)
                        .flatMap(actionCollectionDTO1 -> actionCollectionService.populateActionCollectionByViewMode(
                                actionCollection.getUnpublishedCollection(), false)))
                .map(responseUtils::updateCollectionDTOWithDefaultResources)
                .zipWith(
                        newPageService.findById(pageId, pagePermission.getEditPermission()),
                        (branchedActionCollection, newPage) -> {
                            // redundant check
                            if (newPage.getUnpublishedPage().getLayouts().size() > 0) {
                                // redundant check as the collection lies inside a layout. Maybe required for testcases
                                branchedActionCollection.setErrorReports(newPage.getUnpublishedPage()
                                        .getLayouts()
                                        .get(0)
                                        .getLayoutOnLoadActionErrors());
                            }

                            return branchedActionCollection;
                        });
    }
}
