package com.appsmith.server.solutions.ce;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class ExamplesWorkspaceClonerCEImpl implements ExamplesWorkspaceClonerCE {

    private final WorkspaceService workspaceService;
    private final WorkspaceRepository workspaceRepository;
    private final DatasourceService datasourceService;
    private final DatasourceRepository datasourceRepository;
    private final ConfigService configService;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final LayoutActionService layoutActionService;
    private final ActionCollectionService actionCollectionService;
    private final LayoutCollectionService layoutCollectionService;
    private final ThemeService themeService;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;

    public Mono<Workspace> cloneExamplesWorkspace() {
        return sessionUserService
                .getCurrentUser()
                .flatMap(this::cloneExamplesWorkspace);
    }

    /**
     * Clones the template workspace (as specified in config collection) for the given user. The given user will be
     * the owner of the cloned workspace. This method also assumes that the given user is the same as the user in
     * the current Spring session.
     *
     * @param user User who will be the owner of the cloned workspace.
     * @return Empty Mono.
     */
    private Mono<Workspace> cloneExamplesWorkspace(User user) {
        if (!CollectionUtils.isEmpty(user.getWorkspaceIds())) {
            // Don't create an examples workspace if the user already has some workspaces, perhaps because they
            // were invited to some.
            return Mono.empty();
        }

        return configService.getTemplateWorkspaceId()
                .doOnError(error -> log.error("Error loading template workspace id config.", error))
                .flatMap(templateWorkspaceId -> cloneWorkspaceForUser(
                        templateWorkspaceId,
                        user,
                        configService.getTemplateApplications(),
                        configService.getTemplateDatasources()
                ));
    }

    /**
     * Given a workspace ID and a user, clone the workspace and make the given user the owner of the cloned
     * workspace. This recursively clones all objects inside the workspace. This method also assumes that the
     * given user is the same as the user in the current Spring session.
     *
     * @param templateWorkspaceId workspace ID of the workspace to create a clone of.
     * @param user                   The user who will own the new cloned workspace.
     * @return Publishes the newly created workspace.
     */
    public Mono<Workspace> cloneWorkspaceForUser(
            String templateWorkspaceId,
            User user,
            Flux<Application> applicationFlux,
            Flux<Datasource> datasourceFlux
    ) {

        log.info("Cloning workspace id {}", templateWorkspaceId);

        if (!StringUtils.hasText(templateWorkspaceId)) {
            return Mono.empty();
        }

        return workspaceRepository
                .findById(templateWorkspaceId)
                .doOnSuccess(workspace -> {
                    if (workspace == null) {
                        log.error(
                                "Template examples workspace not found. Not creating a clone for user {}.",
                                user.getEmail()
                        );
                    }
                })
                .flatMap(workspace -> {
                    makePristine(workspace);
                    if (!CollectionUtils.isEmpty(workspace.getUserRoles())) {
                        workspace.getUserRoles().clear();
                    }
                    workspace.setSlug(null);
                    return workspaceService.createDefault(workspace, user);
                })
                .flatMap(newWorkspace -> {
                    User userUpdate = new User();
                    userUpdate.setExamplesWorkspaceId(newWorkspace.getId());
                    userUpdate.setPasswordResetInitiated(user.getPasswordResetInitiated());
                    userUpdate.setSource(user.getSource());
                    userUpdate.setGroupIds(null);
                    userUpdate.setPolicies(null);
                    return Mono
                            .when(
                                    userService.update(user.getId(), userUpdate),
                                    cloneApplications(newWorkspace.getId(), applicationFlux, datasourceFlux)
                            )
                            .thenReturn(newWorkspace);
                })
                .doOnError(error -> log.error("Error cloning examples workspace.", error));
    }

    public Mono<List<String>> cloneApplications(String toWorkspaceId, Flux<Application> applicationFlux) {
        return cloneApplications(toWorkspaceId, applicationFlux, Flux.empty());
    }

    /**
     * Clone all applications (except deleted ones), including it's pages and actions from one workspace into
     * another. Also clones all datasources (not just the ones used by any applications) in the given workspace.
     *
     * @param toWorkspaceId   ID of the workspace that is the target to copy objects to.
     * @return Empty Mono.
     */
    public Mono<List<String>> cloneApplications(
            String toWorkspaceId,
            Flux<Application> applicationFlux,
            Flux<Datasource> datasourceFlux
    ) {
        final List<NewPage> clonedPages = new ArrayList<>();
        final List<String> newApplicationIds = new ArrayList<>();

        // A map of datasourceId => {a cached Mono that clones this datasource and yields the new datasource }.
        final Map<String, Mono<Datasource>> cloneDatasourceMonos = new HashMap<>();

        return datasourceFlux
                .flatMap(datasource -> {
                    final String datasourceId = datasource.getId();
                    final Mono<Datasource> clonerMono = cloneDatasource(datasourceId, toWorkspaceId);
                    cloneDatasourceMonos.put(datasourceId, clonerMono.cache());
                    return clonerMono;
                })
                .thenMany(applicationFlux)
                .flatMap(application -> {
                    application.setWorkspaceId(toWorkspaceId);

                    final String defaultPageId = application.getPages().stream()
                            .filter(ApplicationPage::isDefault)
                            .map(ApplicationPage::getId)
                            .findFirst()
                            .orElse("");

                    return doOnlyCloneApplicationObjectWithoutItsDependenciesAndReturnNonDeletedPages(application, newApplicationIds)
                            .flatMap(page ->
                                    Mono.zip(
                                            Mono.just(page),
                                            Mono.just(defaultPageId.equals(page.getId()))
                                    )
                            );
                })
                .flatMap(tuple -> {
                    final NewPage newPage = tuple.getT1();
                    final boolean isDefault = tuple.getT2();
                    final String templatePageId = newPage.getId();
                    DefaultResources defaults = new DefaultResources();
                    defaults.setApplicationId(newPage.getApplicationId());
                    newPage.setDefaultResources(defaults);
                    makePristine(newPage);
                    PageDTO page = newPage.getUnpublishedPage();

                    if (page.getLayouts() != null) {
                        for (final Layout layout : page.getLayouts()) {
                            layout.setId(new ObjectId().toString());
                        }
                    }

                    page.setApplicationId(newPage.getApplicationId());
                    page.setDefaultResources(defaults);
                    return applicationPageService
                            .createPage(page)
                            .flatMap(savedPage ->
                                    isDefault
                                            ? applicationPageService.makePageDefault(savedPage).thenReturn(savedPage)
                                            : Mono.just(savedPage))
                            .flatMap(savedPage -> newPageRepository.findById(savedPage.getId()))
                            .flatMap(savedPage -> {
                                clonedPages.add(savedPage);
                                return newActionService
                                        .findByPageId(templatePageId)
                                        .map(newAction -> {
                                            ActionDTO action = newAction.getUnpublishedAction();
                                            log.info("Preparing action for cloning {} {}.", action.getName(), newAction.getId());
                                            action.setPageId(savedPage.getId());
                                            action.setDefaultResources(null);
                                            return newAction;
                                        })
                                        .flatMap(newAction -> {
                                            final String originalActionId = newAction.getId();
                                            log.info("Creating clone of action {}", originalActionId);
                                            makePristine(newAction);
                                            newAction.setWorkspaceId(toWorkspaceId);
                                            ActionDTO action = newAction.getUnpublishedAction();
                                            action.setCollectionId(null);

                                            Mono<ActionDTO> actionMono = Mono.just(action);
                                            final Datasource datasourceInsideAction = action.getDatasource();
                                            if (datasourceInsideAction != null) {
                                                if (datasourceInsideAction.getId() != null) {
                                                    final String datasourceId = datasourceInsideAction.getId();
                                                    if (!cloneDatasourceMonos.containsKey(datasourceId)) {
                                                        cloneDatasourceMonos.put(datasourceId, cloneDatasource(datasourceId, toWorkspaceId).cache());
                                                    }
                                                    actionMono = cloneDatasourceMonos.get(datasourceId)
                                                            .map(newDatasource -> {
                                                                action.setDatasource(newDatasource);
                                                                return action;
                                                            });
                                                } else {
                                                    datasourceInsideAction.setWorkspaceId(toWorkspaceId);
                                                }
                                            }
                                            return Mono.zip(actionMono
                                                            .flatMap(actionDTO -> layoutActionService.createAction(
                                                                    actionDTO, new AppsmithEventContext(AppsmithEventContextType.CLONE_PAGE), Boolean.FALSE)
                                                            )
                                                            .map(ActionDTO::getId),
                                                    Mono.justOrEmpty(originalActionId));
                                        })
                                        // This call to `collectMap` will wait for all actions in all pages to have been processed, and so the
                                        // `clonedPages` list will also contain all pages cloned.
                                        .collect(HashMap<String, String>::new, (map, tuple2) -> map.put(tuple2.getT2(), tuple2.getT1()))
                                        .flatMap(actionIdsMap -> {
                                            // Map of <originalCollectionId, clonedActionCollectionIds>
                                            HashMap<String, String> collectionIdsMap = new HashMap<>();
                                            // Pick all action collections
                                            return actionCollectionService
                                                    .findByPageId(templatePageId)
                                                    .flatMap(actionCollection -> {
                                                        // Keep a record of the original collection id
                                                        final String originalCollectionId = actionCollection.getId();
                                                        log.info("Creating clone of action collection {}", originalCollectionId);
                                                        // Sanitize them
                                                        makePristine(actionCollection);
                                                        actionCollection.setPublishedCollection(null);
                                                        final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
                                                        unpublishedCollection.setPageId(savedPage.getId());

                                                        DefaultResources defaultResources = new DefaultResources();
                                                        defaultResources.setPageId(savedPage.getId());
                                                        unpublishedCollection.setDefaultResources(defaultResources);

                                                        actionCollection.setWorkspaceId(toWorkspaceId);
                                                        actionCollection.setApplicationId(savedPage.getApplicationId());

                                                        DefaultResources defaultResources1 = new DefaultResources();
                                                        defaultResources1.setApplicationId(savedPage.getApplicationId());
                                                        actionCollection.setDefaultResources(defaultResources1);

                                                        actionCollectionService.generateAndSetPolicies(savedPage, actionCollection);

                                                        // Replace all action Ids from map and replace with newly created actionIds
                                                        final Map<String, String> newActionIds = new HashMap<>();
                                                        unpublishedCollection
                                                                .getDefaultToBranchedActionIdsMap()
                                                                .forEach((defaultActionId, oldActionId) -> {
                                                                    if (StringUtils.hasLength(oldActionId)
                                                                            && StringUtils.hasLength(actionIdsMap.get(oldActionId))) {

                                                                        // As this is a new application and not connected
                                                                        // through git branch, the default and newly
                                                                        // created actionId will be same
                                                                        newActionIds
                                                                            .put(actionIdsMap.get(oldActionId), actionIdsMap.get(oldActionId));
                                                                    } else {
                                                                        log.debug("Unable to find action {} while forking inside ID map: {}", oldActionId, actionIdsMap);
                                                                    }
                                                                });

                                                        unpublishedCollection.setDefaultToBranchedActionIdsMap(newActionIds);

                                                        return actionCollectionService.create(actionCollection)
                                                                .flatMap(clonedActionCollection -> {
                                                                    if (StringUtils.isEmpty(clonedActionCollection.getDefaultResources().getCollectionId())) {
                                                                        ActionCollection updates = new ActionCollection();
                                                                        DefaultResources defaultResources2 = clonedActionCollection.getDefaultResources();
                                                                        defaultResources2.setCollectionId(clonedActionCollection.getId());
                                                                        updates.setDefaultResources(defaultResources2);
                                                                        return actionCollectionService.update(clonedActionCollection.getId(), updates);
                                                                    }
                                                                    return Mono.just(clonedActionCollection);
                                                                })
                                                                .flatMap(clonedActionCollection -> {
                                                                    collectionIdsMap.put(originalCollectionId, clonedActionCollection.getId());
                                                                    return Flux.fromIterable(newActionIds.values())
                                                                            .flatMap(newActionService::findById)
                                                                            .flatMap(newlyCreatedAction -> {
                                                                                ActionDTO unpublishedAction = newlyCreatedAction.getUnpublishedAction();
                                                                                unpublishedAction.setCollectionId(clonedActionCollection.getId());
                                                                                unpublishedAction.getDefaultResources().setCollectionId(clonedActionCollection.getId());
                                                                                return newActionService.update(newlyCreatedAction.getId(), newlyCreatedAction);
                                                                            })
                                                                            .collectList();
                                                                });
                                                    })
                                                    .collectList()
                                                    .then(Mono.zip(Mono.just(actionIdsMap), Mono.just(collectionIdsMap)));
                                        });
                            });
                })
                .flatMap(tuple -> updateActionAndCollectionsIdsInClonedPages(clonedPages, tuple.getT1(), tuple.getT2()))
                // Now publish all the example applications which have been cloned to ensure that there is a
                // view mode for the newly created user.
                .then(Mono.just(newApplicationIds))
                .flatMapMany(Flux::fromIterable)
                .flatMap(appId -> applicationPageService.publish(appId, false).thenReturn(appId))
                .collectList();
    }

    private Flux<NewPage> updateActionAndCollectionsIdsInClonedPages(List<NewPage> clonedPages,
                                                                     Map<String, String> actionIdsMap,
                                                                     Map<String, String> actionCollectionIdsMap) {
        final List<Mono<NewPage>> pageSaveMonos = new ArrayList<>();

        for (final NewPage page : clonedPages) {
            // If there are no unpublished layouts, there would be no published layouts either.
            // Move on to the next page.
            if (page.getUnpublishedPage().getLayouts() == null) {
                continue;
            }

            boolean shouldSave = false;

            for (final Layout layout : page.getUnpublishedPage().getLayouts()) {
                if (layout.getLayoutOnLoadActions() != null) {
                    shouldSave = updateOnLoadActionsWithNewActionAndCollectionIds(actionIdsMap, actionCollectionIdsMap, page.getId(), shouldSave, layout);
                }
            }

            if (shouldSave) {
                pageSaveMonos.add(newPageRepository.save(page));
            }
        }

        return Flux.concat(pageSaveMonos);
    }

    private boolean updateOnLoadActionsWithNewActionAndCollectionIds(Map<String, String> actionIdsMap,
                                                                     Map<String, String> collectionIdsMap,
                                                                     String pageId,
                                                                     boolean shouldSave,
                                                                     Layout layout) {
        for (final Set<DslActionDTO> actionSet : layout.getLayoutOnLoadActions()) {
            for (final DslActionDTO actionDTO : actionSet) {
                if (actionIdsMap.containsKey(actionDTO.getId())) {
                    final String srcActionId = actionDTO.getId();
                    final String srcCollectionId = actionDTO.getCollectionId();
                    actionDTO.setId(actionIdsMap.get(srcActionId));
                    actionDTO.setDefaultActionId(actionIdsMap.get(srcActionId));
                    if (StringUtils.hasLength(srcCollectionId)) {
                        actionDTO.setDefaultCollectionId(collectionIdsMap.get(actionDTO.getCollectionId()));
                        actionDTO.setCollectionId(collectionIdsMap.get(actionDTO.getCollectionId()));
                    }
                    shouldSave = true;
                } else {
                    log.error(
                            "Couldn't find cloned action ID for publishedLayoutOnLoadAction {} in page {}",
                            actionDTO.getId(),
                            pageId
                    );
                }
            }
        }
        return shouldSave;
    }

    /**
     * This function simply creates a clone of the Application object without cloning its children (page and actions)
     * Once the new application object is created, it adds the new application's id into the list applicationIds
     *
     * @param application : Application to be cloned
     * @param applicationIds : List where the cloned new application's id would be stored
     * @return A flux that yields all the pages in the template application
     */
    private Flux<NewPage> doOnlyCloneApplicationObjectWithoutItsDependenciesAndReturnNonDeletedPages(Application application, List<String> applicationIds) {
        final String templateApplicationId = application.getId();
        return cloneApplicationDocument(application)
                .flatMapMany(
                        savedApplication -> {
                            applicationIds.add(savedApplication.getId());
                            return forkThemes(application, savedApplication).thenMany(
                                    newPageRepository
                                            .findByApplicationIdAndNonDeletedEditMode(templateApplicationId, pagePermission.getReadPermission())
                                            .map(newPage -> {
                                                log.info("Preparing page for cloning {} {}.", newPage.getUnpublishedPage().getName(), newPage.getId());
                                                newPage.setApplicationId(savedApplication.getId());
                                                return newPage;
                                            })
                            );
                        }
                );
    }

    private Mono<UpdateResult> forkThemes(Application srcApplication, Application destApplication) {
        return Mono.zip(
                themeService.cloneThemeToApplication(srcApplication.getEditModeThemeId(), destApplication),
                themeService.cloneThemeToApplication(srcApplication.getPublishedModeThemeId(), destApplication)
        ).flatMap(themes -> {
            Theme editModeTheme = themes.getT1();
            Theme publishedModeTheme = themes.getT2();
            return applicationService.setAppTheme(
                    destApplication.getId(),
                    editModeTheme.getId(),
                    publishedModeTheme.getId(),
                    applicationPermission.getEditPermission()
            );
        });
    }

    private Mono<Application> cloneApplicationDocument(Application application) {
        if (!StringUtils.hasText(application.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        String workspaceId = application.getWorkspaceId();
        if (!StringUtils.hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        // Clean the object so that it will be saved as a new application for the currently signed in user.
        application.setClonedFromApplicationId(application.getId());
        application.setId(null);
        application.setPolicies(new HashSet<>());
        application.setPages(new ArrayList<>());
        application.setPublishedPages(new ArrayList<>());
        application.setIsPublic(false);

        Mono<User> userMono = sessionUserService.getCurrentUser();

        return applicationPageService.setApplicationPolicies(userMono, workspaceId, application)
                .flatMap(applicationToCreate ->
                        createSuffixedApplication(applicationToCreate, applicationToCreate.getName(), 0)
                );
    }

    public Mono<Datasource> cloneDatasource(String datasourceId, String toWorkspaceId) {
        final Mono<List<Datasource>> existingDatasourcesMono = datasourceRepository.findAllByWorkspaceId(toWorkspaceId)
                .collectList();

        return Mono.zip(datasourceRepository.findById(datasourceId), existingDatasourcesMono)
                .flatMap(tuple -> {
                    final Datasource templateDatasource = tuple.getT1();
                    final List<Datasource> existingDatasources = tuple.getT2();

                    final AuthenticationDTO authentication = templateDatasource.getDatasourceConfiguration() == null
                            ? null : templateDatasource.getDatasourceConfiguration().getAuthentication();
                    if (authentication != null) {
                        authentication.setIsAuthorized(null);
                        authentication.setAuthenticationResponse(null);
                    }

                    return Flux.fromIterable(existingDatasources)
                            .map(ds -> {
                                final AuthenticationDTO auth = ds.getDatasourceConfiguration() == null
                                        ? null : ds.getDatasourceConfiguration().getAuthentication();
                                if (auth != null) {
                                    auth.setIsAuthorized(null);
                                    auth.setAuthenticationResponse(null);
                                }
                                return ds;
                            })
                            .filter(templateDatasource::softEquals)
                            .next()  // Get the first matching datasource, we don't need more than one here.
                            .switchIfEmpty(Mono.defer(() -> {
                                // No matching existing datasource found, so create a new one.
                                makePristine(templateDatasource);
                                templateDatasource.setWorkspaceId(toWorkspaceId);
                                return createSuffixedDatasource(templateDatasource);
                            }));
                });
    }

    private Mono<Datasource> createSuffixedDatasource(Datasource datasource) {
        return createSuffixedDatasource(datasource, datasource.getName(), 0);
    }

    /**
     * Tries to create the given datasource with the name, over and over again with an incremented suffix, but **only**
     * if the error is because of a name clash.
     * @param datasource Datasource to try create.
     * @param name Name of the datasource, to which numbered suffixes will be appended.
     * @param suffix Suffix used for appending, recursion artifact. Usually set to 0.
     * @return A Mono that yields the created datasource.
     */
    private Mono<Datasource> createSuffixedDatasource(Datasource datasource, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        datasource.setName(actualName);
        return datasourceService.create(datasource)
                .onErrorResume(DuplicateKeyException.class, error -> {
                    if (error.getMessage() != null
                            && error.getMessage().contains("workspace_datasource_deleted_compound_index")) {
                        // The duplicate key error is because of the `name` field.
                        return createSuffixedDatasource(datasource, name, 1 + suffix);
                    }
                    throw error;
                });
    }

    /**
     * Tries to create the given application with the name, over and over again with an incremented suffix, but **only**
     * if the error is because of a name clash.
     * @param application Application to try create.
     * @param name Name of the application, to which numbered suffixes will be appended.
     * @param suffix Suffix used for appending, recursion artifact. Usually set to 0.
     * @return A Mono that yields the created application.
     */
    private Mono<Application> createSuffixedApplication(Application application, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        application.setName(actualName);
        return applicationService.createDefault(application)
                .onErrorResume(DuplicateKeyException.class, error -> {
                    if (error.getMessage() != null
                            // workspace_application_deleted_gitApplicationMetadata_compound_index
                            && error.getMessage().contains("workspace_application_deleted_gitApplicationMetadata_compound_index")) {
                        // The duplicate key error is because of the `name` field.
                        return createSuffixedApplication(application, name, 1 + suffix);
                    }
                    throw error;
                });
    }

    public void makePristine(BaseDomain domain) {
        // Set the ID to null for this domain object so that it is saved a new document in the database (as opposed to
        // updating an existing document). If it contains any policies, they are also reset.
        domain.setId(null);
        domain.setUpdatedAt(null);
        if (domain.getPolicies() != null) {
            domain.getPolicies().clear();
        }
    }

}
