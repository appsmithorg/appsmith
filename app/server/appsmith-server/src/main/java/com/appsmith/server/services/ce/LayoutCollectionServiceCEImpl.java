package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.ActionCollection.Fields;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.ActionCollectionUpdateDTO;
import com.appsmith.server.dtos.ActionUpdatesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ContextTypeUtils;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.ActionCollectionSpan.ACTION_COLLECTION_UPDATE;
import static com.appsmith.external.constants.spans.ActionCollectionSpan.GENERATE_ACTION_COLLECTION_BY_VIEW_MODE;
import static com.appsmith.external.constants.spans.ActionCollectionSpan.POPULATE_ACTION_COLLECTION_BY_VIEW_MODE;
import static com.appsmith.external.constants.spans.ActionCollectionSpan.SAVE_ACTION_COLLECTION_LAST_EDIT_INFO;
import static com.appsmith.external.constants.spans.ActionSpan.CREATE_ACTION;
import static com.appsmith.external.constants.spans.ActionSpan.DELETE_ACTION;
import static com.appsmith.external.constants.spans.ActionSpan.UPDATE_ACTION;
import static com.appsmith.external.constants.spans.LayoutSpan.UPDATE_LAYOUT_BASED_ON_CONTEXT;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.helpers.ContextTypeUtils.isPageContext;
import static java.util.stream.Collectors.toMap;
import static java.util.stream.Collectors.toSet;

@Slf4j
@RequiredArgsConstructor
public class LayoutCollectionServiceCEImpl implements LayoutCollectionServiceCE {

    private final NewPageService newPageService;
    private final LayoutActionService layoutActionService;
    private final UpdateLayoutService updateLayoutService;
    protected final RefactoringService refactoringService;
    protected final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;
    private final AnalyticsService analyticsService;
    private final ActionCollectionRepository actionCollectionRepository;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final ObservationRegistry observationRegistry;

    @Override
    public Mono<ActionCollectionDTO> createCollection(ActionCollection actionCollection) {
        ActionCollectionDTO collectionDTO = actionCollection.getUnpublishedCollection();
        if (collectionDTO.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        validateApplicationId(collectionDTO);

        // First check if the collection name is allowed
        // If the collection name is unique, the action name will be guaranteed to be unique within that collection
        return checkIfNameAllowedBasedOnContext(collectionDTO)
                .flatMap(isNameAllowed -> {
                    // If the name is allowed, return list of actionDTOs for further processing
                    if (Boolean.TRUE.equals(isNameAllowed)) {
                        return actionCollectionService.validateAndSaveCollection(actionCollection);
                    }
                    // Throw an error since the new action collection's name matches an existing action, widget or
                    // collection name.
                    return Mono.error(new AppsmithException(
                            AppsmithError.DUPLICATE_KEY_USER_ERROR, collectionDTO.getName(), FieldName.NAME));
                })
                .flatMap(collectionDTO1 -> {
                    List<ActionDTO> actions = collectionDTO1.getActions();

                    if (actions == null || actions.isEmpty()) {
                        return Mono.just(collectionDTO1);
                    }

                    return Flux.fromIterable(actions)
                            .flatMap(action -> layoutActionService.updateSingleAction(action.getId(), action))
                            .then(Mono.just(collectionDTO1));
                })
                .flatMap(updatedCollection -> updateLayoutService
                        .updatePageLayoutsByPageId(updatedCollection.getPageId())
                        .thenReturn(updatedCollection));
    }

    private void validateApplicationId(ActionCollectionDTO collectionDTO) {
        if (isPageContext(collectionDTO.getContextType())) {
            String applicationId = collectionDTO.getApplicationId();
            if (StringUtils.isEmpty(applicationId)) {
                throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID);
            }
        }
    }

    protected Mono<Boolean> checkIfNameAllowedBasedOnContext(ActionCollectionDTO collectionDTO) {
        final String pageId = collectionDTO.getPageId();
        Mono<NewPage> pageMono = pagePermission
                .getActionCreatePermission()
                .flatMap(permission -> newPageService.findById(pageId, permission))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                .cache();
        return pageMono.flatMap(page -> {
            Layout layout = page.getUnpublishedPage().getLayouts().get(0);
            CreatorContextType contextType = ContextTypeUtils.getDefaultContextIfNull(collectionDTO.getContextType());
            // Check against widget names and action names
            return refactoringService.isNameAllowed(page.getId(), contextType, layout.getId(), collectionDTO.getName());
        });
    }

    @Override
    public Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collectionDTO) {
        if (collectionDTO.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return validateAndCreateActionCollectionDomain(collectionDTO)
                .flatMap(actionCollection -> createCollection(actionCollection)
                        .flatMap(actionCollectionDTO -> actionCollectionService
                                .saveLastEditInformationInParent(actionCollectionDTO)
                                .thenReturn(actionCollectionDTO)));
    }

    protected Mono<ActionCollection> validateAndCreateActionCollectionDomain(ActionCollectionDTO collectionDTO) {
        if (StringUtils.isEmpty(collectionDTO.getPageId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        if (StringUtils.isEmpty(collectionDTO.getApplicationId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        ActionCollection actionCollection = new ActionCollection();
        actionCollection.setUnpublishedCollection(collectionDTO);

        return pagePermission
                .getActionCreatePermission()
                .flatMap(permission -> newPageService.findById(collectionDTO.getPageId(), permission))
                .map(branchedPage -> {
                    actionCollection.setRefType(branchedPage.getRefType());
                    actionCollection.setRefName(branchedPage.getRefName());
                    actionCollectionService.generateAndSetPolicies(branchedPage, actionCollection);
                    actionCollection.setUnpublishedCollection(collectionDTO);

                    // Update the page and application id with branched resource
                    collectionDTO.setApplicationId(branchedPage.getApplicationId());
                    collectionDTO.setPageId(branchedPage.getId());

                    actionCollection.setWorkspaceId(collectionDTO.getWorkspaceId());
                    actionCollection.setApplicationId(branchedPage.getApplicationId());

                    return actionCollection;
                });
    }

    @Override
    public Mono<ActionCollectionDTO> moveCollection(ActionCollectionMoveDTO actionCollectionMoveDTO) {
        final String collectionId = actionCollectionMoveDTO.getCollectionId();
        final String destinationPageId = actionCollectionMoveDTO.getDestinationPageId();

        Mono<NewPage> destinationPageMono = pagePermission
                .getActionCreatePermission()
                .flatMap(permission ->
                        newPageService.findById(actionCollectionMoveDTO.getDestinationPageId(), permission))
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

                    final Flux<ActionDTO> actionUpdatesFlux = newActionService
                            .findByCollectionIdAndViewMode(
                                    actionCollectionDTO.getId(), false, actionPermission.getEditPermission())
                            .map(newAction -> newActionService.generateActionByViewMode(newAction, false))
                            .flatMap(actionDTO -> {
                                actionDTO.setPageId(destinationPageId);
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
                            .then(pagePermission
                                    .getActionCreatePermission()
                                    .flatMap(permission -> newPageService.findPageById(
                                            actionCollectionMoveDTO.getDestinationPageId(), permission, false)))
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
    public Mono<Integer> updateUnpublishedActionCollectionBody(String id, ActionCollectionDTO actionCollectionDTO) {

        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        if (actionCollectionDTO == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ACTION_COLLECTION));
        }

        if (actionCollectionDTO.getBody() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BODY));
        }

        Mono<ActionCollection> branchedActionCollectionMono = actionCollectionService
                .findById(id, actionPermission.getEditPermission())
                .cache();

        return branchedActionCollectionMono.flatMap(dbActionCollection -> {
            BridgeUpdate updateObj = Bridge.update();
            String path = ActionCollection.Fields.unpublishedCollection + "." + ActionCollectionDTO.Fields.body;
            String updatedAtPath = Fields.updatedAt;

            updateObj.set(path, actionCollectionDTO.getBody());
            updateObj.set(updatedAtPath, Instant.now());

            return actionCollectionRepository.updateByIdWithoutPermissionCheck(dbActionCollection.getId(), updateObj);
        });
    }

    @Override
    public Mono<ActionCollectionDTO> updateUnpublishedActionCollection(
            String id, ActionCollectionDTO actionCollectionDTO) {
        // new actions without ids are to be created
        // new actions with ids are to be updated and added to collection
        // old actions that are now missing are to be archived
        // rest are to be updated
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<ActionCollection> branchedActionCollectionMono = actionCollectionService
                .findById(id, actionPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
                .cache();

        final Set<String> validBaseActionIds = actionCollectionDTO.getActions().stream()
                .map(ActionDTO::getBaseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
        final Set<String> baseActionIds = new HashSet<>();
        baseActionIds.addAll(validBaseActionIds);

        // create duplicate name map
        final Map<String, Long> actionNameCountMap = actionCollectionDTO.getActions().stream()
                .collect(Collectors.groupingBy(ActionDTO::getName, Collectors.counting()));
        List<String> duplicateNames = actionNameCountMap.entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        final Mono<Map<String, String>> newValidActionIdsMono = branchedActionCollectionMono.flatMap(
                branchedActionCollection -> Flux.fromIterable(actionCollectionDTO.getActions())
                        .flatMap(actionDTO -> {
                            actionDTO.setDeletedAt(null);
                            setContextId(branchedActionCollection, actionDTO);
                            actionDTO.setContextType(actionCollectionDTO.getContextType());
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
                                actionDTO.setRefType(branchedActionCollection.getRefType());
                                actionDTO.setRefName(branchedActionCollection.getRefName());

                                // actionCollectionService is a new action, we need to create one
                                if (duplicateNames.contains(actionDTO.getName())) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.DUPLICATE_KEY_USER_ERROR,
                                            actionDTO.getName(),
                                            FieldName.NAME));
                                } else {
                                    return layoutActionService
                                            .createSingleAction(actionDTO, Boolean.TRUE)
                                            .name(CREATE_ACTION)
                                            .tap(Micrometer.observation(observationRegistry));
                                }
                            } else {
                                actionDTO.setCollectionId(null);
                                // Client only knows about the default action ID, fetch branched action id to update the
                                // action
                                String branchedActionId = actionDTO.getId();
                                actionDTO.setId(null);
                                actionDTO.setBaseId(null);
                                return layoutActionService
                                        .updateNewActionByBranchedId(branchedActionId, actionDTO)
                                        .name(UPDATE_ACTION)
                                        .tap(Micrometer.observation(observationRegistry));
                            }
                        })
                        .collect(toMap(actionDTO -> actionDTO.getBaseId(), ActionDTO::getId)));

        // First collect all valid action ids from before, and diff against incoming action ids
        Mono<List<ActionDTO>> deleteNonExistingActionMono = newActionService
                .findByCollectionIdAndViewMode(id, false, actionPermission.getEditPermission())
                .filter(newAction -> !baseActionIds.contains(newAction.getBaseId()))
                .flatMap(x -> newActionService
                        .deleteGivenNewAction(x)
                        // return an empty action so that the filter can remove it from the list
                        .onErrorResume(throwable -> {
                            log.debug(
                                    "Failed to delete action with id {}, {} {} for collection: {}",
                                    x.getBaseId(),
                                    x.getRefType(),
                                    x.getRefName(),
                                    actionCollectionDTO.getName());
                            log.error(throwable.getMessage());
                            return Mono.empty();
                        }))
                .collectList()
                .name(DELETE_ACTION)
                .tap(Micrometer.observation(observationRegistry));

        String body = actionCollectionDTO.getBody();
        Number lineCount = 0;
        if (body != null && !body.isEmpty()) {
            lineCount = body.split("\n").length;
        }
        Number actionCount = 0;
        if (actionCollectionDTO.getActions() != null
                && !actionCollectionDTO.getActions().isEmpty()) {
            actionCount = actionCollectionDTO.getActions().size();
        }

        return deleteNonExistingActionMono
                .then(newValidActionIdsMono)
                .flatMap(tuple -> {
                    return branchedActionCollectionMono.map(dbActionCollection -> {
                        actionCollectionDTO.setId(null);
                        actionCollectionDTO.setBaseId(null);
                        resetContextId(actionCollectionDTO);
                        // Since we have a different endpoint to update the body, we need to remove it from the DTO
                        actionCollectionDTO.setBody(null);

                        copyNewFieldValuesIntoOldObject(
                                actionCollectionDTO, dbActionCollection.getUnpublishedCollection());

                        return dbActionCollection;
                    });
                })
                .flatMap(actionCollection -> actionCollectionService.update(actionCollection.getId(), actionCollection))
                .tag("lineCount", lineCount.toString())
                .tag("actionCount", actionCount.toString())
                .name(ACTION_COLLECTION_UPDATE)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(actionCollectionRepository::setUserPermissionsInObject)
                .flatMap(savedActionCollection -> updateLayoutBasedOnContext(savedActionCollection)
                        .name(UPDATE_LAYOUT_BASED_ON_CONTEXT)
                        .tap(Micrometer.observation(observationRegistry))
                        .thenReturn(savedActionCollection))
                .flatMap(savedActionCollection -> analyticsService.sendUpdateEvent(
                        savedActionCollection, actionCollectionService.getAnalyticsProperties(savedActionCollection)))
                .flatMap(actionCollection -> actionCollectionService
                        .generateActionCollectionByViewMode(actionCollection, false)
                        .name(GENERATE_ACTION_COLLECTION_BY_VIEW_MODE)
                        .tap(Micrometer.observation(observationRegistry))
                        .flatMap(actionCollectionDTO1 -> actionCollectionService
                                .populateActionCollectionByViewMode(actionCollection.getUnpublishedCollection(), false)
                                .name(POPULATE_ACTION_COLLECTION_BY_VIEW_MODE)
                                .tap(Micrometer.observation(observationRegistry))
                                .flatMap(actionCollectionDTO2 -> actionCollectionService
                                        .saveLastEditInformationInParent(actionCollectionDTO2)
                                        .name(SAVE_ACTION_COLLECTION_LAST_EDIT_INFO)
                                        .tap(Micrometer.observation(observationRegistry))
                                        .thenReturn(actionCollectionDTO2))))
                .flatMap(branchedActionCollection -> sendErrorReportsFromPageToCollection(branchedActionCollection));
    }

    @Override
    public Mono<ActionCollectionDTO> updateUnpublishedActionCollectionWithSpecificActions(String id, ActionCollectionUpdateDTO resource) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<ActionCollection> branchedActionCollectionMono = actionCollectionService
            .findById(id, actionPermission.getEditPermission())
            .switchIfEmpty(Mono.error(
                new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
            .cache();

        // create duplicate name map
        final Mono<List<String>> duplicateNamesMono = branchedActionCollectionMono
            .flatMap(actionCollection ->
                actionCollectionService.generateActionCollectionByViewMode(actionCollection, false))
            .flatMapMany(actionCollectionDTO -> Flux.fromIterable(actionCollectionDTO.getActions()))
            .filter(actionDTO -> actionDTO.getId() == null)
            .collect(Collectors.groupingBy(ActionDTO::getName, Collectors.counting()))
            .handle((actionNameCountMap, sink) -> {
                List<String> duplicateNames = actionNameCountMap.entrySet().stream()
                    .filter(entry -> entry.getValue() > 1)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());
                if (!duplicateNames.isEmpty()) {
                    sink.error(new AppsmithException(
                        AppsmithError.DUPLICATE_KEY_USER_ERROR, duplicateNames.get(0), FieldName.NAME));
                    return;
                }
                sink.next(duplicateNames);
            });
        ActionCollectionDTO actionCollectionDTO = resource.getActionCollection();
        ActionUpdatesDTO actionUpdatesDTO = resource.getActions();
        Mono<List<ActionDTO>> addedActionsMono = Mono.just(List.of());
        Mono<List<ActionDTO>> deletedActionsMono = Mono.just(List.of());
        Mono<List<ActionDTO>> modifiedActionsMono = Mono.just(List.of());

        if (actionUpdatesDTO.getAdded() != null && !actionUpdatesDTO.getAdded().isEmpty()) {
            addedActionsMono = duplicateNamesMono
                .zipWith(branchedActionCollectionMono)
                .flatMap(tuple2 -> {
                    List<String> duplicateNames = tuple2.getT1();
                    ActionCollection branchedActionCollection = tuple2.getT2();
                    return Flux.fromIterable(actionUpdatesDTO.getAdded())
                        .flatMap(actionDTO -> {
                            populateActionFieldsFromCollection(actionDTO, branchedActionCollection);

                            if (duplicateNames.contains(actionDTO.getName())) {
                                return Flux.error(new AppsmithException(
                                    AppsmithError.DUPLICATE_KEY_USER_ERROR,
                                    actionDTO.getName(),
                                    FieldName.NAME));
                            } else {
                                return layoutActionService
                                    .createSingleAction(actionDTO, Boolean.TRUE)
                                    .name(CREATE_ACTION)
                                    .tap(Micrometer.observation(observationRegistry));
                            }
                        })
                        .collectList();
                });
        }

        if (actionUpdatesDTO.getModified() != null && !actionUpdatesDTO.getModified().isEmpty()) {
            modifiedActionsMono = branchedActionCollectionMono
                .flatMap(branchedActionCollection -> {
                    return Flux.fromIterable(actionUpdatesDTO.getModified())
                    .flatMap(action -> {
                        populateActionFieldsFromCollection(action, branchedActionCollection);

                        return layoutActionService
                            .updateNewActionByBranchedId(action.getId(), action)
                            .name(UPDATE_ACTION)
                            .tap(Micrometer.observation(observationRegistry));
                    })
                    .collectList();

            });
        }

        if (actionUpdatesDTO.getDeleted() != null && !actionUpdatesDTO.getDeleted().isEmpty()) {
            deletedActionsMono = branchedActionCollectionMono.flatMap(branchedActionCollection -> {
                ActionCollectionDTO actionCollectionDTO1 = branchedActionCollection.getUnpublishedCollection();
                return Flux.fromIterable(actionUpdatesDTO.getDeleted()).flatMap(actionDTO -> {
                        return newActionService
                            .deleteUnpublishedAction(actionDTO.getId())
                            // return an empty action so that the filter can remove it from the list
                            .onErrorResume(throwable -> {
                                log.debug(
                                    "Failed to delete action with id {}, {} {} for collection: {}",
                                    actionDTO.getId(),
                                    branchedActionCollection.getRefType(),
                                    branchedActionCollection.getRefName(),
                                    actionCollectionDTO1.getName());
                                log.error(throwable.getMessage());
                                return Mono.empty();
                            })
                            .name(DELETE_ACTION)
                            .tap(Micrometer.observation(observationRegistry));
                    })
                    .collectList();
            });
        }

        return  Mono.zip(addedActionsMono, deletedActionsMono, modifiedActionsMono)
            .flatMap(tuple3 -> {
                return updateLayoutService.updateLayoutByContextTypeAndContextId(
                    actionCollectionDTO.getContextType(), actionCollectionDTO.getContextId());
            })
            .flatMap(ignored -> postProcessingForActionChanges(id));
    }

    private void populateActionFieldsFromCollection(ActionDTO actionDTO, ActionCollection branchedActionCollection) {
        ActionCollectionDTO actionCollectionDTO = branchedActionCollection.getUnpublishedCollection();
        actionDTO.setDeletedAt(null);
        actionDTO.setContextType(actionCollectionDTO.getContextType());
        actionDTO.setContextId(actionCollectionDTO.getContextId());
        actionDTO.setApplicationId(branchedActionCollection.getApplicationId());
        if (actionDTO.getId() == null) {
            actionDTO.setCollectionId(branchedActionCollection.getId());

            if (actionDTO.getDatasource() == null) {
                actionDTO.autoGenerateDatasource();
            }
            actionDTO.getDatasource().setWorkspaceId(branchedActionCollection.getWorkspaceId());
            actionDTO.getDatasource().setPluginId(actionCollectionDTO.getPluginId());
            actionDTO.getDatasource().setName(FieldName.UNUSED_DATASOURCE);
            actionDTO.setFullyQualifiedName(actionCollectionDTO.getName() + "." + actionDTO.getName());
            actionDTO.setPluginType(actionCollectionDTO.getPluginType());
            actionDTO.setPluginId(actionCollectionDTO.getPluginId());
            actionDTO.setRefType(branchedActionCollection.getRefType());
            actionDTO.setRefName(branchedActionCollection.getRefName());
        }
    }

    private Mono<ActionCollectionDTO> postProcessingForActionChanges(String id) {
        return actionCollectionService.findById(id, actionPermission.getEditPermission())
                .flatMap(actionCollectionRepository::setUserPermissionsInObject)
                .flatMap(savedActionCollection -> analyticsService.sendUpdateEvent(
                        savedActionCollection, actionCollectionService.getAnalyticsProperties(savedActionCollection)))
                .flatMap(actionCollection -> actionCollectionService
                        .generateActionCollectionByViewMode(actionCollection, false)
                        .name(GENERATE_ACTION_COLLECTION_BY_VIEW_MODE)
                        .tap(Micrometer.observation(observationRegistry))
                        .flatMap(actionCollectionDTO1 -> actionCollectionService
                                .populateActionCollectionByViewMode(actionCollection.getUnpublishedCollection(), false)
                                .name(POPULATE_ACTION_COLLECTION_BY_VIEW_MODE)
                                .tap(Micrometer.observation(observationRegistry))
                                .flatMap(actionCollectionDTO2 -> actionCollectionService
                                        .saveLastEditInformationInParent(actionCollectionDTO2)
                                        .name(SAVE_ACTION_COLLECTION_LAST_EDIT_INFO)
                                        .tap(Micrometer.observation(observationRegistry))
                                        .thenReturn(actionCollectionDTO2))))
                .flatMap(this::sendErrorReportsFromPageToCollection);
    }

    private Mono<ActionCollectionDTO> sendErrorReportsFromPageToCollection(
            ActionCollectionDTO branchedActionCollection) {
        if (isPageContext(branchedActionCollection.getContextType())) {
            final String pageId = branchedActionCollection.getPageId();
            return newPageService
                    .findById(pageId, pagePermission.getEditPermission())
                    .flatMap(newPage -> {
                        // Your conditional check
                        if (!newPage.getUnpublishedPage().getLayouts().isEmpty()) {
                            // redundant check as the collection lies inside a layout. Maybe required for
                            // testcases
                            branchedActionCollection.setErrorReports(newPage.getUnpublishedPage()
                                    .getLayouts()
                                    .get(0)
                                    .getLayoutOnLoadActionErrors());

                            // Continue processing or return a different observable if needed
                            return Mono.just(branchedActionCollection);
                        } else {
                            // Return the original branchedActionCollection
                            return Mono.just(branchedActionCollection);
                        }
                    })
                    .map(updatedBranchedActionCollection -> {
                        // Additional mapping or processing if needed
                        return updatedBranchedActionCollection;
                    });
        } else {
            // Handle the case where contextType is not PAGE
            // You might want to return the original branchedActionCollection or handle it as needed
            return Mono.just(branchedActionCollection);
        }
    }

    protected Mono<String> updateLayoutBasedOnContext(ActionCollection savedActionCollection) {
        if (isPageContext(savedActionCollection.getUnpublishedCollection().getContextType())) {
            return updateLayoutService.updatePageLayoutsByPageId(
                    savedActionCollection.getUnpublishedCollection().getPageId());
        }
        return Mono.empty();
    }

    protected void resetContextId(ActionCollectionDTO actionCollectionDTO) {
        if (isPageContext(actionCollectionDTO.getContextType())) {
            actionCollectionDTO.setPageId(null);
        }
    }

    protected void setContextId(ActionCollection branchedActionCollection, ActionDTO actionDTO) {
        if (isPageContext(branchedActionCollection.getUnpublishedCollection().getContextType())) {
            actionDTO.setPageId(
                    branchedActionCollection.getUnpublishedCollection().getPageId());
        }
    }
}
