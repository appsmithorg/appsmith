package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.CollectionService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import static java.util.stream.Collectors.toSet;

@Slf4j
@RequiredArgsConstructor
@Service
public class LayoutActionServiceCEImpl implements LayoutActionServiceCE {

    private final AnalyticsService analyticsService;
    private final NewPageService newPageService;
    private final NewActionService newActionService;
    private final RefactoringService refactoringService;
    private final CollectionService collectionService;
    private final UpdateLayoutService updateLayoutService;
    private final ResponseUtils responseUtils;
    private final DatasourceService datasourceService;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;

    /**
     * Called by Action controller to create Action
     */
    @Override
    public Mono<ActionDTO> createAction(ActionDTO action) {
        if (action.getCollectionId() == null) {
            return this.createSingleAction(action, Boolean.FALSE);
        }

        return this.createSingleAction(action, Boolean.FALSE)
                .flatMap(savedAction ->
                        collectionService.addSingleActionToCollection(action.getCollectionId(), savedAction));
    }

    @Override
    public Mono<ActionDTO> updateAction(String id, ActionDTO action) {

        // Since the policies are server only concept, we should first set this to null.
        action.setPolicies(null);

        // The change was not in CollectionId, just go ahead and update normally
        if (action.getCollectionId() == null) {
            return this.updateSingleAction(id, action).flatMap(updatedAction -> updateLayoutService
                    .updatePageLayoutsByPageId(updatedAction.getPageId())
                    .thenReturn(updatedAction));
        } else if (action.getCollectionId().length() == 0) {
            // The Action has been removed from existing collection.
            return newActionService
                    .getById(id)
                    .flatMap(action1 -> collectionService.removeSingleActionFromCollection(
                            action1.getUnpublishedAction().getCollectionId(), Mono.just(action1)))
                    .flatMap(action1 -> {
                        log.debug("Action {} has been removed from its collection.", action1.getId());
                        action.setCollectionId(null);
                        return this.updateSingleAction(id, action).flatMap(updatedAction -> updateLayoutService
                                .updatePageLayoutsByPageId(updatedAction.getPageId())
                                .thenReturn(updatedAction));
                    });
        } else {
            // If the code flow has reached this point, that means that the collectionId has been changed to another
            // collection.
            // Remove the action from previous collection and add it to the new collection.
            return newActionService
                    .getById(id)
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
                        return collectionService.addSingleActionToCollection(
                                action.getCollectionId(), unpublishedAction);
                    })
                    .flatMap(action1 -> {
                        log.debug(
                                "Action {} removed from its previous collection and added to the new collection",
                                action1.getId());
                        return this.updateSingleAction(id, action).flatMap(updatedAction -> updateLayoutService
                                .updatePageLayoutsByPageId(updatedAction.getPageId())
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
        return destinationPageMono
                .flatMap(destinationPage -> {
                    // 1. Update and save the action
                    if (action.getDefaultResources() == null) {
                        log.debug("Default resource should not be empty for move action: {}", action.getId());
                        DefaultResources defaultResources = new DefaultResources();
                        defaultResources.setPageId(
                                destinationPage.getDefaultResources().getPageId());
                        action.setDefaultResources(defaultResources);
                    } else {
                        action.getDefaultResources()
                                .setPageId(destinationPage.getDefaultResources().getPageId());
                    }
                    return newActionService
                            .updateUnpublishedAction(action.getId(), action)
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND,
                                    actionMoveDTO.getAction().getId())));
                })
                .flatMap(savedAction ->
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

    @Override
    public Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO, String branchName) {

        // As client only have default page Id it will be sent under action and not the action.defaultResources
        Mono<String> toPageMono = newPageService
                .findByBranchNameAndDefaultPageId(
                        branchName, actionMoveDTO.getDestinationPageId(), pagePermission.getActionCreatePermission())
                .map(NewPage::getId);

        Mono<NewAction> branchedActionMono = newActionService.findByBranchNameAndDefaultActionId(
                branchName, actionMoveDTO.getAction().getId(), actionPermission.getEditPermission());

        return Mono.zip(toPageMono, branchedActionMono)
                .flatMap(tuple -> {
                    String toPageId = tuple.getT1();
                    NewAction branchedAction = tuple.getT2();
                    ActionDTO moveAction = actionMoveDTO.getAction();
                    actionMoveDTO.setDestinationPageId(toPageId);
                    moveAction.setPageId(branchedAction.getUnpublishedAction().getPageId());
                    moveAction.setId(branchedAction.getId());
                    moveAction.setDefaultResources(
                            branchedAction.getUnpublishedAction().getDefaultResources());
                    return moveAction(actionMoveDTO);
                })
                .map(responseUtils::updateActionDTOWithDefaultResources);
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
     * @param action
     * @return
     */
    @Override
    public Mono<ActionDTO> updateSingleAction(String id, ActionDTO action) {
        return newActionService
                .updateUnpublishedAction(id, action)
                .flatMap(newActionService::populateHintMessages)
                .cache();
    }

    @Override
    public Mono<ActionDTO> updateSingleActionWithBranchName(
            String defaultActionId, ActionDTO action, String branchName) {
        return newActionService
                .findByBranchNameAndDefaultActionId(branchName, defaultActionId, actionPermission.getEditPermission())
                .flatMap(newAction -> updateActionBasedOnContextType(newAction, action));
    }

    /**
     * Does not check for any CreatorContext on Actions.
     * This is a basic action update, which updates actions related to pages.
     */
    protected Mono<ActionDTO> updateActionBasedOnContextType(NewAction newAction, ActionDTO action) {
        String pageId = action.getPageId();
        action.setApplicationId(null);
        action.setPageId(null);
        return updateSingleAction(newAction.getId(), action)
                .flatMap(updatedAction ->
                        updateLayoutService.updatePageLayoutsByPageId(pageId).thenReturn(updatedAction))
                .map(responseUtils::updateActionDTOWithDefaultResources)
                .zipWith(
                        newPageService.findPageById(pageId, pagePermission.getEditPermission(), false),
                        (actionDTO, pageDTO) -> {
                            // redundant check
                            if (pageDTO.getLayouts().size() > 0) {
                                actionDTO.setErrorReports(
                                        pageDTO.getLayouts().get(0).getLayoutOnLoadActionErrors());
                            }
                            return actionDTO;
                        });
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
                            .then(newActionService.generateActionByViewMode(savedAction, false)));
                });
    }

    @Override
    public Mono<ActionDTO> setExecuteOnLoad(String defaultActionId, String branchName, Boolean isExecuteOnLoad) {
        return newActionService
                .findByBranchNameAndDefaultActionId(branchName, defaultActionId, actionPermission.getEditPermission())
                .flatMap(branchedAction -> setExecuteOnLoad(branchedAction.getId(), isExecuteOnLoad))
                .map(responseUtils::updateActionDTOWithDefaultResources);
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
                .flatMap(tuple -> {
                    ActionDTO actionDTO = tuple.getT1();
                    return Mono.just(actionDTO);
                });
    }

    public Mono<ActionDTO> deleteUnpublishedAction(String defaultActionId, String branchName) {
        return newActionService
                .findByBranchNameAndDefaultActionId(branchName, defaultActionId, actionPermission.getDeletePermission())
                .flatMap(branchedAction -> deleteUnpublishedAction(branchedAction.getId()))
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    @Override
    public Mono<ActionDTO> createSingleActionWithBranch(ActionDTO action, String branchName) {

        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setBranchName(branchName);

        return newPageService
                .findByBranchNameAndDefaultPageId(
                        branchName, action.getPageId(), pagePermission.getActionCreatePermission())
                .flatMap(newPage -> {
                    // Update the page and application id with branched resource
                    action.setPageId(newPage.getId());
                    action.setApplicationId(newPage.getApplicationId());

                    DefaultResources pageDefaultIds = newPage.getDefaultResources();
                    defaultResources.setPageId(pageDefaultIds.getPageId());
                    defaultResources.setApplicationId(pageDefaultIds.getApplicationId());
                    if (StringUtils.isEmpty(defaultResources.getCollectionId())) {
                        defaultResources.setCollectionId(action.getCollectionId());
                    }
                    action.setDefaultResources(defaultResources);
                    return createSingleAction(action, Boolean.FALSE);
                })
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    @Override
    public Mono<ActionDTO> createSingleAction(ActionDTO action, Boolean isJsAction) {
        AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.DEFAULT);
        return createAction(action, eventContext, isJsAction);
    }

    @Override
    public Mono<ActionDTO> createAction(ActionDTO action, AppsmithEventContext eventContext, Boolean isJsAction) {

        if (!StringUtils.hasLength(action.getPageId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        NewAction newAction = newActionService.generateActionDomain(action);

        // If the action is a JS action, then we don't need to validate the page. Fetch the page with read.
        // Else fetch the page with create action permission to ensure that the user has the right to create an action
        AclPermission aclPermission =
                isJsAction ? pagePermission.getReadPermission() : pagePermission.getActionCreatePermission();

        Mono<NewPage> pageMono = newPageService
                .findById(action.getPageId(), aclPermission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, action.getPageId())))
                .cache();

        return pageMono.flatMap(page -> {
                    Layout layout = page.getUnpublishedPage().getLayouts().get(0);
                    String name = action.getValidName();
                    CreatorContextType contextType =
                            action.getContextType() == null ? CreatorContextType.PAGE : action.getContextType();
                    return refactoringService.isNameAllowed(page.getId(), contextType, layout.getId(), name);
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

                    // If the datasource is embedded, check for workspaceId and set it in action
                    if (action.getDatasource() != null && action.getDatasource().getId() == null) {
                        Datasource datasource = action.getDatasource();
                        if (datasource.getWorkspaceId() == null) {
                            return Mono.error(
                                    new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
                        }
                        newAction.setWorkspaceId(datasource.getWorkspaceId());
                    }

                    // New actions will never be set to auto-magical execution, unless it is triggered via a
                    // page or application clone event.
                    if (!AppsmithEventContextType.CLONE_PAGE.equals(eventContext.getAppsmithEventContextType())) {
                        action.setExecuteOnLoad(false);
                    }

                    newAction.setUnpublishedAction(action);

                    newActionService.updateDefaultResourcesInAction(newAction);

                    return Mono.just(newAction);
                })
                .flatMap(savedNewAction -> newActionService
                        .validateAndSaveActionToRepository(savedNewAction)
                        .zipWith(Mono.just(savedNewAction)))
                .zipWhen(zippedActions -> {
                    ActionDTO savedActionDTO = zippedActions.getT1();
                    if (savedActionDTO.getDatasource() != null
                            && savedActionDTO.getDatasource().getId() != null) {
                        return datasourceService.findById(
                                savedActionDTO.getDatasource().getId());
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
}
