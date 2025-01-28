package com.appsmith.server.fork.internal;

import com.appsmith.external.constants.ActionCreationSourceTypeEnum;
import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.CreateActionMetaDTO;
import com.appsmith.server.dtos.ForkingMetaDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.fork.forkable.ForkableService;
import com.appsmith.server.helpers.UserPermissionUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static com.appsmith.server.helpers.ce.PolicyUtil.policyMapToSet;

@RequiredArgsConstructor
@Slf4j
public class ApplicationForkingServiceCEImpl implements ApplicationForkingServiceCE {

    protected final ApplicationService applicationService;
    protected final WorkspaceService workspaceService;
    protected final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    protected final WorkspacePermission workspacePermission;
    protected final ApplicationPermission applicationPermission;
    private final ImportService importService;
    private final ApplicationPageService applicationPageService;
    protected final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final LayoutActionService layoutActionService;
    private final ActionCollectionService actionCollectionService;
    private final ThemeService themeService;
    protected final PagePermission pagePermission;
    protected final ActionPermission actionPermission;
    private final PermissionGroupService permissionGroupService;
    private final ActionCollectionRepository actionCollectionRepository;
    private final NewActionRepository newActionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ForkableService<Datasource> datasourceForkableService;
    private final UpdateLayoutService updateLayoutService;
    /**
     * Clone all applications (except deleted ones), including its pages and actions from one workspace into
     * another. Also clones all datasources (not just the ones used by any applications) provided in the parameter list.
     * This allows us to have more fine-grained control over the clone operation.
     *
     * @param toWorkspaceId       ID of the workspace that is the target to copy objects to.
     * @param sourceEnvironmentId
     * @return Empty Mono.
     */
    public Mono<List<String>> forkApplications(
            String toWorkspaceId, Application application, String sourceEnvironmentId) {

        final List<NewPage> clonedPages = new ArrayList<>();
        final List<String> newApplicationIds = new ArrayList<>();

        // A map of datasourceId => { a cached Mono that clones this datasource and yields the cloned datasource }
        final Map<String, Mono<Datasource>> clonedDatasourceMonos = new HashMap<>();

        final Map<ForkingMetaDTO, Flux<NewAction>> forkingSourceToForkableActionsFluxMap = new ConcurrentHashMap<>();
        ForkingMetaDTO sourceMeta = new ForkingMetaDTO();
        sourceMeta.setWorkspaceId(application.getWorkspaceId());
        sourceMeta.setEnvironmentId(sourceEnvironmentId);
        sourceMeta.setApplicationId(application.getId());
        ForkingMetaDTO targetMeta = new ForkingMetaDTO();
        targetMeta.setWorkspaceId(toWorkspaceId);

        Mono<List<Datasource>> existingDatasourcesMono = datasourceForkableService
                .getExistingEntitiesInTarget(toWorkspaceId)
                .collectList()
                .cache();

        final Mono<String> updateTargetEnvironmentIdMono = workspaceService
                .getDefaultEnvironmentId(toWorkspaceId, null)
                .doOnNext(targetEnvironmentId -> {
                    targetMeta.setEnvironmentId(targetEnvironmentId);
                });

        application.setWorkspaceId(toWorkspaceId);
        // Extracting forkWithConfiguration to use below before resetting it for newly forked app
        // forkWithConfig by default remains FALSE for datasources used in an application
        Boolean forkWithConfig;
        if (Boolean.TRUE.equals(application.getForkWithConfiguration())) {
            forkWithConfig = Boolean.TRUE;
        } else {
            forkWithConfig = Boolean.FALSE;
        }
        sourceMeta.setForkWithConfiguration(forkWithConfig);
        // Setting the forkWithConfiguration, exportWithConfiguration and forkingEnabled fields to null for
        // newly forked app
        application.setForkWithConfiguration(null);
        application.setExportWithConfiguration(null);
        application.setForkingEnabled(null);

        final String defaultPageId = application.getPages().stream()
                .filter(ApplicationPage::isDefault)
                .map(ApplicationPage::getId)
                .findFirst()
                .orElse("");

        return updateTargetEnvironmentIdMono
                .thenMany(doOnlyForkApplicationObjectWithoutItsDependenciesAndReturnNonDeletedPages(
                                application, newApplicationIds)
                        .flatMap(page -> Mono.zip(Mono.just(page), Mono.just(defaultPageId.equals(page.getId())))))
                .flatMap(tuple -> {
                    final NewPage newPage = tuple.getT1();
                    final boolean isDefault = tuple.getT2();
                    final String templatePageId = newPage.getId();
                    newPage.makePristine();
                    newPage.setGitSyncId(null);
                    PageDTO page = newPage.getUnpublishedPage();

                    if (page.getLayouts() != null) {
                        for (final Layout layout : page.getLayouts()) {
                            layout.setId(new ObjectId().toString());
                        }
                    }

                    page.setApplicationId(newPage.getApplicationId());

                    ForkingMetaDTO sourceMetaForPage = sourceMeta.toBuilder()
                            .applicationId(page.getApplicationId())
                            .pageId(page.getId())
                            .forkWithConfiguration(forkWithConfig)
                            .build();

                    Mono<NewPage> createForkedPageMono = applicationPageService
                            .createPage(page)
                            .flatMap(savedPage -> isDefault
                                    ? applicationPageService
                                            .makePageDefault(savedPage)
                                            .thenReturn(savedPage)
                                    : Mono.just(savedPage))
                            .flatMap(savedPage -> newPageRepository.findById(savedPage.getId()));

                    return createForkedPageMono.flatMap(savedPage -> {
                        clonedPages.add(savedPage);
                        Flux<NewAction> sourceActionFlux = newActionService
                                .findByPageIdsForExport(List.of(templatePageId), Optional.empty())
                                .cache();

                        forkingSourceToForkableActionsFluxMap.put(sourceMetaForPage, sourceActionFlux);

                        ForkingMetaDTO targetMetaForPage = targetMeta.toBuilder()
                                .applicationId(newPage.getApplicationId())
                                .pageId(newPage.getId())
                                .forkWithConfiguration(forkWithConfig)
                                .build();

                        Flux<Datasource> forkableDatasourceFlux = datasourceForkableService
                                .getForkableEntitiesFromSource(sourceMetaForPage, sourceActionFlux)
                                .map(forkableDatasource -> {
                                    if (!clonedDatasourceMonos.containsKey(forkableDatasource.getId())) {
                                        Mono<Datasource> datasourceMono = datasourceForkableService
                                                .createForkedEntity(
                                                        forkableDatasource,
                                                        sourceMetaForPage,
                                                        targetMetaForPage,
                                                        existingDatasourcesMono)
                                                .cache();
                                        clonedDatasourceMonos.put(forkableDatasource.getId(), datasourceMono);
                                    }
                                    return forkableDatasource;
                                });

                        Mono<HashMap<String, String>> forkedCollectionsMono = actionCollectionService
                                .findByPageId(templatePageId)
                                .flatMap(actionCollection -> {
                                    // Keep a record of the original collection id
                                    final String originalCollectionId = actionCollection.getId();
                                    log.info("Creating clone of action collection {}", originalCollectionId);
                                    // Sanitize them
                                    actionCollection.makePristine();
                                    actionCollection.setGitSyncId(null);
                                    actionCollection.setPublishedCollection(null);
                                    final ActionCollectionDTO unpublishedCollection =
                                            actionCollection.getUnpublishedCollection();
                                    unpublishedCollection.setPageId(savedPage.getId());

                                    actionCollection.setWorkspaceId(toWorkspaceId);
                                    actionCollection.setApplicationId(savedPage.getApplicationId());

                                    actionCollectionService.generateAndSetPolicies(savedPage, actionCollection);

                                    return actionCollectionService
                                            .create(actionCollection)
                                            .flatMap(clonedActionCollection -> {
                                                Mono<Tuple2<String, String>> tuple2Mono = Mono.zip(
                                                        Mono.just(clonedActionCollection.getId()),
                                                        Mono.just(originalCollectionId));

                                                if (org.springframework.util.StringUtils.isEmpty(
                                                        clonedActionCollection.getBaseId())) {
                                                    ActionCollection updates = new ActionCollection();
                                                    updates.setBaseId(clonedActionCollection.getId());
                                                    return actionCollectionService
                                                            .update(clonedActionCollection.getId(), updates)
                                                            .then(tuple2Mono);
                                                }
                                                return tuple2Mono;
                                            });
                                })
                                .collect(
                                        HashMap<String, String>::new,
                                        (map, tuple2) -> map.put(tuple2.getT2(), tuple2.getT1()))
                                .cache();

                        Mono<HashMap<String, String>> forkedActionsMono =
                                forkedCollectionsMono.flatMap(collectionIdMap -> {
                                    return sourceActionFlux
                                            .map(newAction -> {
                                                ActionDTO action = newAction.getUnpublishedAction();
                                                log.info(
                                                        "Preparing action for cloning {} {}.",
                                                        action.getName(),
                                                        newAction.getId());
                                                action.setPageId(savedPage.getId());
                                                action.setBaseId(null);
                                                action.setRefType(null);
                                                action.setRefName(null);
                                                return newAction;
                                            })
                                            .flatMap(newAction -> {
                                                final String originalActionId = newAction.getId();
                                                String originalCollectionId = newAction
                                                        .getUnpublishedAction()
                                                        .getCollectionId();
                                                String forkedCollectionId = collectionIdMap.get(originalCollectionId);
                                                log.info("Creating clone of action {}", originalActionId);
                                                newAction.makePristine();
                                                newAction.setGitSyncId(null);
                                                newAction.setWorkspaceId(toWorkspaceId);
                                                ActionDTO action = newAction.getUnpublishedAction();
                                                action.setCollectionId(forkedCollectionId);

                                                Mono<ActionDTO> actionMono = Mono.just(action);
                                                final Datasource datasourceInsideAction = action.getDatasource();
                                                if (datasourceInsideAction != null) {
                                                    if (datasourceInsideAction.getId() != null) {
                                                        final String datasourceId = datasourceInsideAction.getId();
                                                        actionMono = clonedDatasourceMonos
                                                                .get(datasourceId)
                                                                .map(newDatasource -> {
                                                                    action.setDatasource(newDatasource);
                                                                    return action;
                                                                });
                                                    } else {
                                                        // If this is an embedded datasource, the config will get forked
                                                        // along with the action
                                                        datasourceInsideAction.setWorkspaceId(toWorkspaceId);
                                                    }
                                                }
                                                return Mono.zip(
                                                        actionMono
                                                                .flatMap(actionDTO -> {
                                                                    actionDTO.setId(null);
                                                                    // Indicates that source of action creation is fork
                                                                    // application
                                                                    actionDTO.setSource(
                                                                            ActionCreationSourceTypeEnum
                                                                                    .FORK_APPLICATION);

                                                                    CreateActionMetaDTO createActionMetaDTO =
                                                                            new CreateActionMetaDTO();
                                                                    createActionMetaDTO.setIsJsAction(Boolean.FALSE);
                                                                    createActionMetaDTO.setEventContext(
                                                                            new AppsmithEventContext(
                                                                                    AppsmithEventContextType
                                                                                            .CLONE_PAGE));
                                                                    return layoutActionService.createAction(
                                                                            actionDTO, createActionMetaDTO);
                                                                })
                                                                .map(ActionDTO::getId),
                                                        Mono.justOrEmpty(originalActionId));
                                            })
                                            // This call to `collectMap` will wait for all actions in all pages to have
                                            // been processed,
                                            // and so the `clonedPages` list will also contain all pages cloned.
                                            .collect(
                                                    HashMap::new,
                                                    (map, tuple2) -> map.put(tuple2.getT2(), tuple2.getT1()));
                                });

                        return forkableDatasourceFlux
                                .then(forkedCollectionsMono)
                                .zipWhen(forkedCollectionsMap -> forkedActionsMono);
                    });
                })
                .flatMapIterable(tuple2 -> clonedPages)
                .flatMap(clonedPage -> updateLayoutService.updatePageLayoutsByPageId(clonedPage.getId()))
                .onErrorResume(throwable -> {
                    if (throwable instanceof AppsmithException e
                            && AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE.equals(e.getError())) {
                        log.error("Error while cloning page {} ", throwable.getMessage());
                        return Mono.just("");
                    }
                    return Mono.error(throwable);
                })
                // Now publish all the example applications which have been cloned to ensure that there is a
                // view mode for the newly created user.
                .then(Mono.just(newApplicationIds))
                .flatMapMany(Flux::fromIterable)
                .flatMap(appId -> applicationPageService.publish(appId, false).thenReturn(appId))
                .collectList();
    }

    /**
     * This function simply creates a clone of the Application object without cloning its children (page and actions)
     * Once the new application object is created, it adds the new application's id into the list applicationIds
     *
     * @param application    : Application to be cloned
     * @param applicationIds : List where the cloned new application's id would be stored
     * @return A flux that yields all the pages in the template application
     */
    private Flux<NewPage> doOnlyForkApplicationObjectWithoutItsDependenciesAndReturnNonDeletedPages(
            Application application, List<String> applicationIds) {
        final String templateApplicationId = application.getId();
        return forkApplicationDocument(application).flatMapMany(savedApplication -> {
            applicationIds.add(savedApplication.getId());
            return forkThemes(application, savedApplication)
                    .thenMany(newPageRepository
                            .findByApplicationIdAndNonDeletedEditMode(
                                    templateApplicationId, pagePermission.getReadPermission())
                            .map(newPage -> {
                                log.info(
                                        "Preparing page for cloning {} {}.",
                                        newPage.getUnpublishedPage().getName(),
                                        newPage.getId());
                                newPage.setApplicationId(savedApplication.getId());
                                return newPage;
                            }));
        });
    }

    private Mono<Integer> forkThemes(Application srcApplication, Application destApplication) {
        return Mono.zip(
                        themeService.cloneThemeToApplication(srcApplication.getEditModeThemeId(), destApplication),
                        themeService.cloneThemeToApplication(srcApplication.getPublishedModeThemeId(), destApplication))
                .flatMap(themes -> {
                    Theme editModeTheme = themes.getT1();
                    Theme publishedModeTheme = themes.getT2();
                    return applicationService.setAppTheme(
                            destApplication.getId(),
                            editModeTheme.getId(),
                            publishedModeTheme.getId(),
                            applicationPermission.getEditPermission());
                });
    }

    private Mono<Application> forkApplicationDocument(Application application) {
        if (!org.springframework.util.StringUtils.hasText(application.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        String workspaceId = application.getWorkspaceId();
        if (!org.springframework.util.StringUtils.hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        // Clean the object so that it will be saved as a new application for the currently signed in user.
        application.setClonedFromApplicationId(application.getId());
        application.setId(null);
        application.setPolicies(new HashSet<>());
        application.setPages(new ArrayList<>());
        application.setPublishedPages(new ArrayList<>());
        application.setIsPublic(false);
        application.setIsCommunityTemplate(false);

        Mono<User> userMono = sessionUserService.getCurrentUser();

        return applicationPageService
                .setApplicationPolicies(userMono, workspaceId, application)
                .flatMap(applicationService::createBaseApplication);
    }

    @Override
    public Mono<Application> forkApplicationToWorkspaceWithEnvironment(
            String srcApplicationId, String targetWorkspaceId, String sourceEnvironmentId) {
        final Mono<Application> sourceApplicationMono = applicationService
                .findById(srcApplicationId, applicationPermission.getReadPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, srcApplicationId)));

        final Mono<Workspace> targetWorkspaceMono = workspaceService
                .findById(targetWorkspaceId, workspacePermission.getApplicationCreatePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, targetWorkspaceId)));

        Mono<User> userMono = sessionUserService.getCurrentUser();

        // For collecting all the possible event data
        Map<String, Object> eventData = new HashMap<>();

        Mono<Application> forkApplicationMono = Mono.zip(sourceApplicationMono, targetWorkspaceMono, userMono)
                .flatMap(tuple -> {
                    final Application application = tuple.getT1();
                    final Workspace targetWorkspace = tuple.getT2();
                    final User user = tuple.getT3();

                    eventData.put(FieldName.WORKSPACE, targetWorkspace);

                    // If the forking application is connected to git, do not copy those data to the new forked
                    // application
                    application.setGitApplicationMetadata(null);

                    boolean allowFork = (
                            // Is this a non-anonymous user that has access to this application?
                            !user.isAnonymous()
                                    && application
                                            .getUserPermissions()
                                            .contains(applicationPermission
                                                    .getEditPermission()
                                                    .getValue()))
                            || Boolean.TRUE.equals(application.getForkingEnabled());

                    if (!allowFork) {
                        return Mono.error(new AppsmithException(AppsmithError.APPLICATION_FORKING_NOT_ALLOWED));
                    }

                    return this.forkApplications(targetWorkspace.getId(), application, sourceEnvironmentId);
                })
                .flatMap(applicationIds -> {
                    final String newApplicationId = applicationIds.get(0);
                    return applicationService
                            .getById(newApplicationId)
                            .flatMap(application -> sendForkApplicationAnalyticsEvent(
                                    srcApplicationId, targetWorkspaceId, application, eventData));
                });

        // Fork application is currently a slow API because it needs to create application, clone all the pages, and
        // then
        // copy all the actions and collections. This process may take time and the client may cancel the request.
        // This leads to the flow getting stopped midway producing corrupted DB objects. The following ensures that even
        // though the client may have cancelled the flow, the forking of the application should proceed uninterrupted
        // and whenever the user refreshes the page, the sane forked application is available.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
        // means that even if the subscriber has cancelled its subscription, the create method still generates its
        // event.
        return Mono.create(
                sink -> forkApplicationMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    public Mono<ApplicationImportDTO> forkApplicationToWorkspace(
            String branchedSourceApplicationId, String targetWorkspaceId) {

        // First we try to find the correct database entry of application to fork, based on git
        Mono<Application> applicationMono;

        applicationMono = applicationService
                .findById(branchedSourceApplicationId, applicationPermission.getReadPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedSourceApplicationId)))
                .flatMap(application -> {
                    if ((application.getGitApplicationMetadata() == null)
                            || application
                                    .getGitApplicationMetadata()
                                    .getRefName()
                                    .equals(application
                                            .getGitApplicationMetadata()
                                            .getDefaultBranchName())) {
                        return Mono.just(application);
                    }
                    // For git connected application user can update the default branch
                    // In such cases we should fork the application from the new default branch
                    return applicationService.findByBranchNameAndBaseApplicationId(
                            application.getGitApplicationMetadata().getDefaultBranchName(),
                            application.getGitApplicationMetadata().getDefaultArtifactId(),
                            applicationPermission.getReadPermission());
                });

        return checkPermissionsForForking(branchedSourceApplicationId, targetWorkspaceId)
                .then(applicationMono)
                // We will be forking to the default environment in the new workspace
                .zipWhen(application -> workspaceService.getDefaultEnvironmentId(application.getWorkspaceId(), null))
                .flatMap(tuple -> {
                    String fromApplicationId = tuple.getT1().getId();
                    String sourceEnvironmentId = tuple.getT2();
                    return forkApplicationToWorkspaceWithEnvironment(
                                    fromApplicationId, targetWorkspaceId, sourceEnvironmentId)
                            .flatMap(application -> importService.getArtifactImportDTO(
                                    application.getWorkspaceId(),
                                    application.getId(),
                                    application,
                                    ArtifactType.APPLICATION))
                            .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);
                });
    }

    private Mono<Application> sendForkApplicationAnalyticsEvent(
            String applicationId, String workspaceId, Application application, Map<String, Object> eventData) {
        return applicationService
                .findById(applicationId, applicationPermission.getReadPermission())
                .flatMap(sourceApplication -> {
                    final Map<String, Object> data = Map.of(
                            "forkedFromAppId",
                            applicationId,
                            "forkedToOrgId",
                            workspaceId,
                            "forkedFromAppName",
                            sourceApplication.getName(),
                            FieldName.EVENT_DATA,
                            eventData);

                    return analyticsService.sendObjectEvent(AnalyticsEvents.FORK, application, data);
                })
                .onErrorResume(e -> {
                    log.warn("Error sending action execution data point", e);
                    return Mono.just(application);
                });
    }

    private Mono<Boolean> checkPermissionsForForking(String branchedApplicationId1, String targetWorkspaceId) {
        Mono<Application> applicationMonoWithOutPermission = applicationService
                .findById(branchedApplicationId1, null)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId1)))
                .cache();

        // For sample apps that are marked as forked, we allow forking to any workspace without any permission checks
        return isForkingEnabled(applicationMonoWithOutPermission).flatMap(isForkingEnabled -> {
            if (isForkingEnabled) {
                return Mono.just(Boolean.TRUE);
            }

            // Normal Application forking with developer/edit access
            Flux<BaseDomain> pageFlux = applicationMonoWithOutPermission.flatMapMany(application -> newPageRepository
                    .findIdsAndPolicyMapByApplicationIdIn(List.of(application.getId()))
                    .map(idPoliciesOnly -> {
                        NewPage newPage = new NewPage();
                        newPage.setId(idPoliciesOnly.getId());
                        Set<Policy> policies = policyMapToSet(idPoliciesOnly.getPolicyMap());
                        newPage.setPolicies(policies);
                        return newPage;
                    })
                    .flatMap(newPageRepository::setUserPermissionsInObject));

            Flux<BaseDomain> actionFlux =
                    applicationMonoWithOutPermission.flatMapMany(application -> newActionRepository
                            .findIdsAndPolicyMapByApplicationIdIn(List.of(application.getId()))
                            .map(idPoliciesOnly -> {
                                NewAction newAction = new NewAction();
                                newAction.setId(idPoliciesOnly.getId());
                                Set<Policy> policies = policyMapToSet(idPoliciesOnly.getPolicyMap());
                                newAction.setPolicies(policies);
                                return newAction;
                            })
                            .flatMap(newActionRepository::setUserPermissionsInObject));

            Flux<BaseDomain> actionCollectionFlux =
                    applicationMonoWithOutPermission.flatMapMany(application -> actionCollectionRepository
                            .findIdsAndPolicyMapByApplicationIdIn(List.of(application.getId()))
                            .map(idPoliciesOnly -> {
                                ActionCollection actionCollection = new ActionCollection();
                                actionCollection.setId(idPoliciesOnly.getId());
                                Set<Policy> policies = policyMapToSet(idPoliciesOnly.getPolicyMap());
                                actionCollection.setPolicies(policies);
                                return actionCollection;
                            })
                            .flatMap(actionCollectionRepository::setUserPermissionsInObject));

            Flux<BaseDomain> workspaceFlux = Flux.from(workspaceRepository
                    .findById(targetWorkspaceId)
                    .flatMap(workspaceRepository::setUserPermissionsInObject));

            Mono<Set<String>> permissionGroupIdsMono =
                    permissionGroupService.getSessionUserPermissionGroupIds().cache();

            Mono<Boolean> pagesValidatedForPermission = UserPermissionUtils.validateDomainObjectPermissionsOrError(
                    pageFlux,
                    FieldName.PAGE,
                    permissionGroupIdsMono,
                    pagePermission.getEditPermission(),
                    AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS);
            Mono<Boolean> actionsValidatedForPermission = UserPermissionUtils.validateDomainObjectPermissionsOrError(
                    actionFlux,
                    FieldName.ACTION,
                    permissionGroupIdsMono,
                    actionPermission.getEditPermission(),
                    AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS);
            Mono<Boolean> actionCollectionsValidatedForPermission =
                    UserPermissionUtils.validateDomainObjectPermissionsOrError(
                            actionCollectionFlux,
                            FieldName.ACTION,
                            permissionGroupIdsMono,
                            actionPermission.getEditPermission(),
                            AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS);
            Mono<Boolean> workspaceValidatedForCreateApplicationPermission =
                    UserPermissionUtils.validateDomainObjectPermissionsOrError(
                            workspaceFlux,
                            FieldName.WORKSPACE,
                            permissionGroupIdsMono,
                            workspacePermission.getApplicationCreatePermission(),
                            AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS);
            Mono<Boolean> workspaceValidatedForCreateDatasourcePermission =
                    UserPermissionUtils.validateDomainObjectPermissionsOrError(
                            workspaceFlux,
                            FieldName.WORKSPACE,
                            permissionGroupIdsMono,
                            workspacePermission.getDatasourceCreatePermission(),
                            AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS);

            return Mono.when(
                            pagesValidatedForPermission,
                            actionsValidatedForPermission,
                            actionCollectionsValidatedForPermission,
                            workspaceValidatedForCreateApplicationPermission,
                            workspaceValidatedForCreateDatasourcePermission)
                    .thenReturn(Boolean.TRUE);
        });
    }

    protected Mono<Boolean> isForkingEnabled(Mono<Application> applicationMono) {
        return applicationMono
                .map(application -> Boolean.TRUE.equals(application.getForkingEnabled()))
                .defaultIfEmpty(Boolean.FALSE);
    }
}
