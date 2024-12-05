package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.CreateActionMetaDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.CollectionService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import static com.appsmith.external.constants.spans.ActionSpan.GET_ACTION_BY_ID;
import static com.appsmith.external.constants.spans.ActionSpan.UPDATE_ACTION_BASED_ON_CONTEXT;
import static com.appsmith.external.constants.spans.ActionSpan.UPDATE_SINGLE_ACTION;
import static com.appsmith.external.constants.spans.ActionSpan.VALIDATE_AND_GENERATE_ACTION_DOMAIN_BASED_ON_CONTEXT;
import static com.appsmith.external.constants.spans.ActionSpan.VALIDATE_AND_SAVE_ACTION_TO_REPOSITORY;
import static com.appsmith.external.constants.spans.DatasourceSpan.FIND_DATASOURCE_BY_ID;
import static com.appsmith.external.constants.spans.LayoutSpan.UPDATE_PAGE_LAYOUT_BY_PAGE_ID;
import static com.appsmith.external.constants.spans.PageSpan.GET_PAGE_BY_ID;
import static com.appsmith.external.constants.spans.PageSpan.IS_NAME_ALLOWED;
import static java.util.stream.Collectors.toSet;

@Slf4j
@RequiredArgsConstructor
@Service
public class LayoutActionServiceCEImpl implements LayoutActionServiceCE {

    private final AnalyticsService analyticsService;
    private final NewPageService newPageService;
    protected final NewActionService newActionService;
    protected final RefactoringService refactoringService;
    private final CollectionService collectionService;
    private final UpdateLayoutService updateLayoutService;
    private final DatasourceService datasourceService;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final ObservationRegistry observationRegistry;

    /**
     * Called by Action controller to create Action
     */
    @Override
    public Mono<ActionDTO> createAction(ActionDTO actionDTO) {
        if (actionDTO.getCollectionId() == null) {
            return this.createSingleAction(actionDTO, Boolean.FALSE);
        }

        return this.createSingleAction(actionDTO, Boolean.FALSE)
                .flatMap(savedAction ->
                        collectionService.addSingleActionToCollection(actionDTO.getCollectionId(), savedAction));
    }

    @Override
    public Mono<ActionDTO> updateAction(String id, ActionDTO actionDTO) {

        // Since the policies are server only concept, we should first set this to null.
        actionDTO.setPolicies(null);

        // The change was not in CollectionId, just go ahead and update normally
        if (actionDTO.getCollectionId() == null) {
            return this.updateSingleAction(id, actionDTO).flatMap(updatedAction -> updateLayoutService
                    .updatePageLayoutsByPageId(updatedAction.getPageId())
                    .name(UPDATE_PAGE_LAYOUT_BY_PAGE_ID)
                    .tap(Micrometer.observation(observationRegistry))
                    .thenReturn(updatedAction));
        } else if (actionDTO.getCollectionId().length() == 0) {
            // The Action has been removed from existing collection.
            return newActionService
                    .getByIdWithoutPermissionCheck(id)
                    .flatMap(action1 -> collectionService.removeSingleActionFromCollection(
                            action1.getUnpublishedAction().getCollectionId(), Mono.just(action1)))
                    .flatMap(action1 -> {
                        log.debug("Action {} has been removed from its collection.", action1.getId());
                        actionDTO.setCollectionId(null);
                        return this.updateSingleAction(id, actionDTO).flatMap(updatedAction -> updateLayoutService
                                .updatePageLayoutsByPageId(updatedAction.getPageId())
                                .name(UPDATE_PAGE_LAYOUT_BY_PAGE_ID)
                                .tap(Micrometer.observation(observationRegistry))
                                .thenReturn(updatedAction));
                    });
        } else {
            // If the code flow has reached this point, that means that the collectionId has been changed to another
            // collection.
            // Remove the action from previous collection and add it to the new collection.
            return newActionService
                    .getByIdWithoutPermissionCheck(id)
                    .flatMap(action1 -> {
                        if (action1.getUnpublishedAction().getCollectionId() != null) {
                            return collectionService.removeSingleActionFromCollection(
                                    action1.getUnpublishedAction().getCollectionId(), Mono.just(action1));
                        }
                        return Mono.just(newActionService.generateActionByViewMode(action1, false));
                    })
                    .map(obj -> (NewAction) obj)
                    .flatMap(action1 -> {
                        ActionDTO unpublishedAction = action1.getUnpublishedAction();
                        unpublishedAction.setId(action1.getId());
                        unpublishedAction.setBaseId(action1.getBaseIdOrFallback());
                        return collectionService.addSingleActionToCollection(
                                actionDTO.getCollectionId(), unpublishedAction);
                    })
                    .flatMap(action1 -> {
                        log.debug(
                                "Action {} removed from its previous collection and added to the new collection",
                                action1.getId());
                        return this.updateSingleAction(id, actionDTO).flatMap(updatedAction -> updateLayoutService
                                .updatePageLayoutsByPageId(updatedAction.getPageId())
                                .name(UPDATE_PAGE_LAYOUT_BY_PAGE_ID)
                                .tap(Micrometer.observation(observationRegistry))
                                .thenReturn(updatedAction));
                    });
        }
    }

    @Override
    public Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO) {
        ActionDTO action = actionMoveDTO.getAction();
        String oldPageId = actionMoveDTO.getAction().getPageId();
        final String destinationPageId = actionMoveDTO.getDestinationPageId();
        action.setPageId(destinationPageId);

        Mono<NewPage> destinationPageMono = newPageService
                .findById(destinationPageId, pagePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, destinationPageId)));

        /*
         * The following steps are followed here :
         * 1. Fetch destination page, update default page ID in actionDTO
         * 2. Update and save the action
         * 3. Run updateLayout on the old page
         * 4. Run updateLayout on the new page.
         * 5. Return the saved action.
         */
        Mono<ActionDTO> updateActionMono = newActionService
                .updateUnpublishedAction(action.getId(), action)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND,
                        actionMoveDTO.getAction().getId())));
        return destinationPageMono
                .then(Mono.defer(() -> updateActionMono))
                .flatMap(savedAction ->
                        // TODO This can be zipped, they're update layouts on two independent pages
                        // fetch the unpublished source page
                        newPageService
                                .findPageById(oldPageId, pagePermission.getEditPermission(), false)
                                .flatMap(page -> {
                                    if (page.getLayouts() == null) {
                                        return Mono.empty();
                                    }

                                    // 2. Run updateLayout on the old page
                                    return Flux.fromIterable(page.getLayouts())
                                            .flatMap(layout -> {
                                                layout.setDsl(
                                                        updateLayoutService.unescapeMongoSpecialCharacters(layout));
                                                return updateLayoutService.updateLayout(
                                                        page.getId(), page.getApplicationId(), layout.getId(), layout);
                                            })
                                            .collect(toSet());
                                })
                                // fetch the unpublished destination page
                                .then(newPageService.findPageById(
                                        actionMoveDTO.getDestinationPageId(),
                                        pagePermission.getActionCreatePermission(),
                                        false))
                                .flatMap(page -> {
                                    if (page.getLayouts() == null) {
                                        return Mono.empty();
                                    }

                                    // 3. Run updateLayout on the new page.
                                    return Flux.fromIterable(page.getLayouts())
                                            .flatMap(layout -> {
                                                layout.setDsl(
                                                        updateLayoutService.unescapeMongoSpecialCharacters(layout));
                                                return updateLayoutService.updateLayout(
                                                        page.getId(), page.getApplicationId(), layout.getId(), layout);
                                            })
                                            .collect(toSet());
                                })
                                // 4. Return the saved action.
                                .thenReturn(savedAction));
    }

    /**
     * After updating the action, page layout needs to be updated to update the page load actions with the new json
     * path keys.
     * <p>
     * Calling the base function would make redundant DB calls and slow down this API unnecessarily.
     * <p>
     * At this point the user must have MANAGE_PAGE permissions because update action also leads to the page's
     * actions on load to change.
     *
     * @param id
     * @param actionDTO
     * @return
     */
    @Override
    public Mono<ActionDTO> updateSingleAction(String id, ActionDTO actionDTO) {
        return newActionService
                .updateUnpublishedAction(id, actionDTO)
                .flatMap(newActionService::populateHintMessages)
                .cache();
    }

    @Override
    public Mono<ActionDTO> updateNewActionByBranchedId(String branchedId, ActionDTO actionDTO) {
        return newActionService
                .findById(branchedId, actionPermission.getEditPermission())
                .name(GET_ACTION_BY_ID)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(newAction -> updateActionBasedOnContextType(newAction, actionDTO)
                        .name(UPDATE_ACTION_BASED_ON_CONTEXT)
                        .tap(Micrometer.observation(observationRegistry)));
    }

    /**
     * Does not check for any CreatorContext on Actions.
     * This is a basic action update, which updates actions related to pages.
     */
    protected Mono<ActionDTO> updateActionBasedOnContextType(NewAction newAction, ActionDTO action) {
        log.debug("Updating action based on context type with action id: {}", action != null ? action.getId() : null);
        String pageId = newAction.getUnpublishedAction().getPageId();
        action.setApplicationId(null);
        action.setPageId(null);

        // Update page layout is skipped for JS actions here because when JSobject is updated, we first
        // update all actions, action
        // collection and then we update the page layout, hence updating page layout with each action update
        // is not required here
        if (action.getPluginType() == PluginType.JS) {
            return updateSingleAction(newAction.getId(), action)
                    .name(UPDATE_SINGLE_ACTION)
                    .tap(Micrometer.observation(observationRegistry));
        } else {
            return updateSingleAction(newAction.getId(), action)
                    .name(UPDATE_SINGLE_ACTION)
                    .tap(Micrometer.observation(observationRegistry))
                    .flatMap(updatedAction -> updateLayoutService
                            .updatePageLayoutsByPageId(pageId)
                            .name(UPDATE_PAGE_LAYOUT_BY_PAGE_ID)
                            .tap(Micrometer.observation(observationRegistry))
                            .thenReturn(updatedAction))
                    .zipWhen(
                            actionDTO -> newPageService.findPageById(pageId, pagePermission.getEditPermission(), false))
                    .map(tuple2 -> {
                        ActionDTO actionDTO = tuple2.getT1();
                        PageDTO pageDTO = tuple2.getT2();
                        // redundant check
                        if (pageDTO.getLayouts().size() > 0) {
                            actionDTO.setErrorReports(
                                    pageDTO.getLayouts().get(0).getLayoutOnLoadActionErrors());
                        }
                        log.debug(
                                "Update action based on context type completed, returning actionDTO with action id: {}",
                                actionDTO != null ? actionDTO.getId() : null);
                        return actionDTO;
                    });
        }
    }

    @Override
    public Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad) {
        return newActionService
                .findById(id, actionPermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)))
                .flatMap(newAction -> {
                    ActionDTO action = newAction.getUnpublishedAction();

                    action.setUserSetOnLoad(true);
                    action.setExecuteOnLoad(isExecuteOnLoad);

                    newAction.setUnpublishedAction(action);

                    return newActionService.save(newAction).flatMap(savedAction -> updateLayoutService
                            .updatePageLayoutsByPageId(
                                    savedAction.getUnpublishedAction().getPageId())
                            .name(UPDATE_PAGE_LAYOUT_BY_PAGE_ID)
                            .tap(Micrometer.observation(observationRegistry))
                            .thenReturn(newActionService.generateActionByViewMode(savedAction, false)));
                });
    }

    /**
     * - Delete action.
     * - Update page layout since a deleted action cannot be marked as on page load.
     */
    public Mono<ActionDTO> deleteUnpublishedAction(String id) {
        return newActionService
                .deleteUnpublishedAction(id)
                .flatMap(actionDTO -> Mono.zip(
                        Mono.just(actionDTO), updateLayoutService.updatePageLayoutsByPageId(actionDTO.getPageId())))
                .name(UPDATE_PAGE_LAYOUT_BY_PAGE_ID)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(tuple -> {
                    ActionDTO actionDTO = tuple.getT1();
                    return Mono.just(actionDTO);
                })
                .flatMap(actionDTO -> newActionService
                        .saveLastEditInformationInParent(actionDTO)
                        .thenReturn(actionDTO));
    }

    @Override
    public Mono<ActionDTO> createSingleAction(ActionDTO actionDTO) {
        return createSingleAction(actionDTO, Boolean.FALSE);
    }

    @Override
    public Mono<ActionDTO> createSingleAction(ActionDTO actionDTO, Boolean isJsAction) {
        if (!StringUtils.hasLength(actionDTO.getPageId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        AclPermission aclPermission =
                isJsAction ? pagePermission.getReadPermission() : pagePermission.getActionCreatePermission();

        return newPageService
                .findById(actionDTO.getPageId(), aclPermission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, actionDTO.getPageId())))
                .flatMap(newPage -> {
                    actionDTO.setBranchName(newPage.getBranchName());
                    AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.DEFAULT);
                    CreateActionMetaDTO createActionMetaDTO = new CreateActionMetaDTO();
                    createActionMetaDTO.setIsJsAction(isJsAction);
                    createActionMetaDTO.setNewPage(newPage);
                    createActionMetaDTO.setEventContext(eventContext);
                    return createAction(actionDTO, createActionMetaDTO);
                });
    }

    @Override
    public Mono<ActionDTO> createAction(ActionDTO actionDTO, CreateActionMetaDTO actionMetaDTO) {
        AppsmithEventContext eventContext = actionMetaDTO.getEventContext();
        return validateAndGenerateActionDomainBasedOnContext(actionDTO, actionMetaDTO)
                .name(VALIDATE_AND_GENERATE_ACTION_DOMAIN_BASED_ON_CONTEXT)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(newAction -> {
                    // If the datasource is embedded, check for workspaceId and set it in action
                    if (actionDTO.getDatasource() != null
                            && actionDTO.getDatasource().getId() == null) {
                        Datasource datasource = actionDTO.getDatasource();
                        if (datasource.getWorkspaceId() == null) {
                            return Mono.error(
                                    new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
                        }
                        newAction.setWorkspaceId(datasource.getWorkspaceId());
                    }

                    // New actions will never be set to auto-magical execution, unless it is triggered via a
                    // page or application clone event.
                    if (!AppsmithEventContextType.CLONE_PAGE.equals(eventContext.getAppsmithEventContextType())) {
                        actionDTO.setExecuteOnLoad(false);
                    }

                    newAction.setUnpublishedAction(actionDTO);

                    return Mono.just(newAction);
                })
                .flatMap(savedNewAction -> newActionService
                        .validateAndSaveActionToRepository(savedNewAction)
                        .name(VALIDATE_AND_SAVE_ACTION_TO_REPOSITORY)
                        .tap(Micrometer.observation(observationRegistry))
                        .zipWith(Mono.just(savedNewAction)))
                .zipWhen(zippedActions -> {
                    ActionDTO savedActionDTO = zippedActions.getT1();
                    if (savedActionDTO.getDatasource() != null
                            && savedActionDTO.getDatasource().getId() != null) {
                        return datasourceService
                                .findById(savedActionDTO.getDatasource().getId())
                                .name(FIND_DATASOURCE_BY_ID)
                                .tap(Micrometer.observation(observationRegistry));
                    } else {
                        return Mono.justOrEmpty(savedActionDTO.getDatasource());
                    }
                })
                .flatMap(zippedData -> {
                    final Tuple2<ActionDTO, NewAction> zippedActions = zippedData.getT1();
                    final Datasource datasource = zippedData.getT2();
                    final NewAction newAction1 = zippedActions.getT2();
                    final Datasource embeddedDatasource =
                            newAction1.getUnpublishedAction().getDatasource();
                    embeddedDatasource.setIsMock(datasource.getIsMock());
                    embeddedDatasource.setIsTemplate(datasource.getIsTemplate());

                    return analyticsService
                            .sendCreateEvent(newAction1, newActionService.getAnalyticsProperties(newAction1))
                            .thenReturn(zippedActions.getT1());
                });
    }

    protected Mono<NewAction> validateAndGenerateActionDomainBasedOnContext(
            ActionDTO action, CreateActionMetaDTO actionMetaDTO) {
        Boolean isJsAction = actionMetaDTO.getIsJsAction();
        NewPage newPage = actionMetaDTO.getNewPage();
        if (!StringUtils.hasLength(action.getPageId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }
        // If the action is a JS action, then we don't need to validate the page. Fetch the page with read.
        // Else fetch the page with create action permission to ensure that the user has the right to create an action
        AclPermission aclPermission =
                isJsAction ? pagePermission.getReadPermission() : pagePermission.getActionCreatePermission();

        Mono<NewPage> pageMono = newPage != null
                ? Mono.just(newPage)
                : newPageService
                        .findById(action.getPageId(), aclPermission)
                        .name(GET_PAGE_BY_ID)
                        .tap(Micrometer.observation(observationRegistry))
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, action.getPageId())))
                        .cache();

        final NewAction newAction = newActionService.generateActionDomain(action);

        return pageMono.flatMap(page -> {
                    Layout layout = page.getUnpublishedPage().getLayouts().get(0);
                    String name = action.getValidName();
                    CreatorContextType contextType =
                            action.getContextType() == null ? CreatorContextType.PAGE : action.getContextType();

                    if (!isJsAction) {
                        return refactoringService
                                .isNameAllowed(page.getId(), contextType, layout.getId(), name)
                                .name(IS_NAME_ALLOWED)
                                .tap(Micrometer.observation(observationRegistry));
                    }
                    return Mono.just(true);
                })
                .flatMap(nameAllowed -> {
                    // If the name is allowed, return pageMono for further processing
                    if (Boolean.TRUE.equals(nameAllowed)) {
                        return pageMono;
                    }
                    String name = action.getValidName();
                    // Throw an error since the new action's name matches an existing action or widget name.
                    return Mono.error(
                            new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR, name, FieldName.NAME));
                })
                .flatMap(page -> {
                    // Inherit the action policies from the page.
                    newActionService.generateAndSetActionPolicies(page, newAction);

                    newActionService.setCommonFieldsFromActionDTOIntoNewAction(action, newAction);

                    // Set the application id in the main domain
                    newAction.setApplicationId(page.getApplicationId());
                    return Mono.just(newAction);
                });
    }
}
