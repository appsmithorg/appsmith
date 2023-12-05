package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.ApplicationPublishingMetaDTO;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.UserPermissionUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import com.google.common.base.Strings;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.UpdateResult;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.apache.commons.lang.ObjectUtils.defaultIfNull;

@Slf4j
@RequiredArgsConstructor
@Service
public class ApplicationPageServiceCEImpl implements ApplicationPageServiceCE {

    private final WorkspaceService workspaceService;
    private final ApplicationService applicationService;
    private final SessionUserService sessionUserService;
    private final WorkspaceRepository workspaceRepository;
    private final LayoutActionService layoutActionService;
    private final UpdateLayoutService updateLayoutService;

    private final AnalyticsService analyticsService;
    private final PolicyGenerator policyGenerator;

    private final ApplicationRepository applicationRepository;
    private final NewPageService newPageService;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final GitFileUtils gitFileUtils;
    private final ThemeService themeService;
    private final ResponseUtils responseUtils;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final TransactionalOperator transactionalOperator;

    private final PermissionGroupService permissionGroupService;
    private final ActionCollectionRepository actionCollectionRepository;
    private final NewActionRepository newActionRepository;
    private final NewPageRepository newPageRepository;
    private final DatasourceRepository datasourceRepository;
    private final DatasourcePermission datasourcePermission;
    private final DSLMigrationUtils dslMigrationUtils;

    public static final Integer EVALUATION_VERSION = 2;

    @Override
    public Mono<PageDTO> createPage(PageDTO page) {
        if (page.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        } else if (page.getName() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        } else if (page.getApplicationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        List<Layout> layoutList = page.getLayouts();
        if (layoutList == null) {
            layoutList = new ArrayList<>();
        }

        if (layoutList.isEmpty()) {
            layoutList.add(newPageService.createDefaultLayout());
            page.setLayouts(layoutList);
        }

        for (final Layout layout : layoutList) {
            if (StringUtils.isEmpty(layout.getId())) {
                layout.setId(new ObjectId().toString());
            }
        }

        Mono<Application> applicationMono = applicationService
                .findById(page.getApplicationId(), applicationPermission.getPageCreatePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, page.getApplicationId())))
                .cache();

        Mono<PageDTO> pageMono = applicationMono.map(application -> {
            generateAndSetPagePolicies(application, page);
            if (page.getDefaultResources() == null) {
                DefaultResources defaults = new DefaultResources();
                defaults.setApplicationId(page.getApplicationId());
                page.setDefaultResources(defaults);
            }
            return page;
        });

        return pageMono.flatMap(newPageService::createDefault)
                // After the page has been saved, update the application (save the page id inside the application)
                .zipWith(applicationMono)
                .flatMap(tuple -> {
                    final PageDTO savedPage = tuple.getT1();
                    final Application application = tuple.getT2();
                    return addPageToApplication(application, savedPage, false)
                            .then(applicationService.saveLastEditInformation(application.getId()))
                            .thenReturn(savedPage);
                });
    }

    public Mono<PageDTO> createPageWithBranchName(PageDTO page, String branchName) {

        DefaultResources defaultResources =
                page.getDefaultResources() == null ? new DefaultResources() : page.getDefaultResources();
        if (StringUtils.isEmpty(defaultResources.getApplicationId())) {
            // Client will be aware of default application Id only so we are safe to assume this
            defaultResources.setApplicationId(page.getApplicationId());
        }
        defaultResources.setBranchName(branchName);
        return applicationService
                .findBranchedApplicationId(
                        branchName,
                        defaultResources.getApplicationId(),
                        applicationPermission.getPageCreatePermission())
                .flatMap(branchedApplicationId -> {
                    page.setApplicationId(branchedApplicationId);
                    page.setDefaultResources(defaultResources);
                    return createPage(page);
                })
                .map(responseUtils::updatePageDTOWithDefaultResources);
    }

    /**
     * This function is called during page create in Page Service. It adds the given page to its ApplicationPages list.
     * Note: It is assumed here that `application` is already checked for the MANAGE_APPLICATIONS policy.
     *
     * @param application Application to which the page will be added. Should have an `id` already.
     * @param page        Page to be added to the application. Should have an `id` already.
     * @return UpdateResult object with details on how many documents have been updated, which should be 0 or 1.
     */
    @Override
    public Mono<UpdateResult> addPageToApplication(Application application, PageDTO page, Boolean isDefault) {

        String defaultPageId = page.getDefaultResources() == null
                        || StringUtils.isEmpty(page.getDefaultResources().getPageId())
                ? page.getId()
                : page.getDefaultResources().getPageId();
        if (isDuplicatePage(application, page.getId())) {
            return applicationRepository
                    .addPageToApplication(application.getId(), page.getId(), isDefault, defaultPageId)
                    .doOnSuccess(result -> {
                        if (result.getModifiedCount() != 1) {
                            log.error(
                                    "Add page to application didn't update anything, probably because application wasn't found.");
                        }
                    });
        } else {
            return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY, page.getId()));
        }
    }

    private Boolean isDuplicatePage(Application application, String pageId) {
        if (application.getPages() != null) {
            int count = (int) application.getPages().stream()
                    .filter(applicationPage -> applicationPage.getId().equals(pageId))
                    .count();
            if (count > 0) {
                return Boolean.FALSE;
            }
        }
        return Boolean.TRUE;
    }

    private PageDTO getDslEscapedPage(PageDTO page) {
        List<Layout> layouts = page.getLayouts();
        if (layouts == null || layouts.isEmpty()) {
            return page;
        }
        for (Layout layout : layouts) {
            if (layout.getDsl() == null
                    || layout.getMongoEscapedWidgetNames() == null
                    || layout.getMongoEscapedWidgetNames().isEmpty()) {
                continue;
            }
            layout.setDsl(updateLayoutService.unescapeMongoSpecialCharacters(layout));
        }
        page.setLayouts(layouts);
        return page;
    }

    @Override
    public Mono<PageDTO> getPage(NewPage newPage, boolean viewMode) {
        return newPageService.getPageByViewMode(newPage, viewMode).map(page -> getDslEscapedPage(page));
    }

    @Override
    public Mono<PageDTO> getPage(String pageId, boolean viewMode) {
        AclPermission permission = pagePermission.getReadPermission();
        return newPageService
                .findPageById(pageId, permission, viewMode)
                .map(newPage -> getDslEscapedPage(newPage))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)));
    }

    @Override
    public Mono<PageDTO> getPageAndMigrateDslByBranchAndDefaultPageId(
            String defaultPageId, String branchName, boolean viewMode, boolean migrateDsl) {
        // Fetch the page with read permission in both editor and in viewer.
        return newPageService
                .findByBranchNameAndDefaultPageId(branchName, defaultPageId, pagePermission.getReadPermission())
                .flatMap(newPage -> {
                    return sendPageViewAnalyticsEvent(newPage, viewMode)
                            .then(getPage(newPage, viewMode))
                            .zipWith(Mono.just(newPage));
                })
                .flatMap(objects -> {
                    PageDTO pageDTO = objects.getT1();
                    if (migrateDsl) {
                        // Call the DSL Utils for on demand migration of the page.
                        // Based on view mode save the migrated DSL to the database
                        // Migrate the DSL to the latest version if required
                        NewPage newPage = objects.getT2();
                        if (pageDTO.getLayouts() != null) {
                            return migrateAndUpdatePageDsl(newPage, pageDTO, viewMode);
                        }
                    }
                    return Mono.just(pageDTO);
                })
                .map(responseUtils::updatePageDTOWithDefaultResources);
    }

    private Mono<PageDTO> migrateAndUpdatePageDsl(NewPage newPage, PageDTO page, boolean viewMode) {
        return dslMigrationUtils
                .getLatestDslVersion()
                .onErrorMap(throwable -> {
                    log.error("Error fetching latest DSL version", throwable);
                    return new AppsmithException(AppsmithError.RTS_SERVER_ERROR, "Error fetching latest DSL version");
                })
                .flatMap(latestDslVersion -> {
                    // ensuring that the page has only one layout, as we don't support multiple layouts yet
                    // when multiple layouts are supported, this code will have to be updated
                    assert page.getLayouts().size() == 1;

                    Layout layout = page.getLayouts().get(0);
                    JSONObject layoutDsl = layout.getDsl();
                    boolean isMigrationRequired = true;
                    String versionKey = "version";
                    if (layoutDsl.containsKey(versionKey)) {
                        int currentDslVersion =
                                layoutDsl.getAsNumber(versionKey).intValue();
                        if (currentDslVersion >= latestDslVersion) {
                            isMigrationRequired = false;
                        }
                    }

                    if (isMigrationRequired) {
                        return dslMigrationUtils
                                .migratePageDsl(layoutDsl)
                                .onErrorMap(throwable -> {
                                    log.error("Error while migrating DSL ", throwable);
                                    return new AppsmithException(
                                            AppsmithError.RTS_SERVER_ERROR,
                                            "Error while migrating to latest DSL version");
                                })
                                .flatMap(migratedDsl -> {
                                    // update the current page DTO with migrated dsl
                                    page.getLayouts().get(0).setDsl(migratedDsl);

                                    // update the new page with migrated dsl and save to the database
                                    PageDTO updatedPage;
                                    if (viewMode) {
                                        updatedPage = newPage.getPublishedPage();
                                    } else {
                                        updatedPage = newPage.getUnpublishedPage();
                                    }
                                    updatedPage.getLayouts().get(0).setDsl(migratedDsl);
                                    return newPageService.save(newPage).thenReturn(page);
                                });
                    }
                    return Mono.just(page);
                });
    }

    @Override
    public Mono<PageDTO> getPageByName(String applicationName, String pageName, boolean viewMode) {
        AclPermission appPermission;
        AclPermission pagePermission1;
        if (viewMode) {
            // If view is set, then this user is trying to view the application
            appPermission = applicationPermission.getReadPermission();
            pagePermission1 = pagePermission.getReadPermission();
        } else {
            appPermission = applicationPermission.getEditPermission();
            pagePermission1 = pagePermission.getEditPermission();
        }

        return applicationService
                .findByName(applicationName, appPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE + " by application name", applicationName)))
                .flatMap(application -> newPageService.findByNameAndApplicationIdAndViewMode(
                        pageName, application.getId(), pagePermission1, viewMode))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE + " by page name", pageName)));
    }

    @Override
    public Mono<Application> makePageDefault(PageDTO page) {
        return makePageDefault(page.getApplicationId(), page.getId());
    }

    @Override
    public Mono<Application> makePageDefault(String applicationId, String pageId) {
        // Since this can only happen during edit, the page in question is unpublished page. Set the view mode
        // accordingly
        Boolean viewMode = false;
        return newPageService
                .findPageById(pageId, pagePermission.getEditPermission(), viewMode)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                // Check if the page actually belongs to the application.
                .flatMap(page -> {
                    if (page.getApplicationId().equals(applicationId)) {
                        return Mono.just(page);
                    }
                    return Mono.error(new AppsmithException(
                            AppsmithError.PAGE_DOESNT_BELONG_TO_APPLICATION, page.getName(), applicationId));
                })
                .then(applicationService.findById(applicationId, applicationPermission.getEditPermission()))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(application -> applicationRepository
                        .setDefaultPage(applicationId, pageId)
                        .then(applicationService.getById(applicationId)));
    }

    @Override
    public Mono<Application> makePageDefault(String defaultApplicationId, String defaultPageId, String branchName) {
        // TODO remove the dependency of applicationId as pageId and branch can get the exact resource
        return newPageService
                .findByBranchNameAndDefaultPageId(branchName, defaultPageId, pagePermission.getEditPermission())
                .flatMap(branchedPage -> makePageDefault(branchedPage.getApplicationId(), branchedPage.getId()))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    @Override
    public Mono<Application> createApplication(Application application) {
        return createApplication(application, application.getWorkspaceId());
    }

    @Override
    public Mono<Application> createApplication(Application application, String workspaceId) {
        if (application.getName() == null || application.getName().trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (workspaceId == null || workspaceId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        application.setPublishedPages(new ArrayList<>());
        application.setUnpublishedCustomJSLibs(new HashSet<>());
        application.setCollapseInvisibleWidgets(Boolean.TRUE);

        // For all new applications being created, set it to use the latest evaluation version.
        application.setEvaluationVersion(EVALUATION_VERSION);
        application.setApplicationVersion(ApplicationVersion.LATEST_VERSION);

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        Mono<Application> applicationWithPoliciesMono = setApplicationPolicies(userMono, workspaceId, application);

        return applicationWithPoliciesMono
                .zipWith(userMono)
                .flatMap(tuple -> {
                    Application application1 = tuple.getT1();
                    application1.setModifiedBy(tuple.getT2().getUsername()); // setting modified by to current user
                    // assign the default theme id to edit mode
                    return themeService
                            .getDefaultThemeId()
                            .map(themeId -> {
                                application1.setEditModeThemeId(themeId);
                                application1.setPublishedModeThemeId(themeId);
                                return themeId;
                            })
                            .then(applicationService.createDefaultApplication(application1));
                })
                .flatMap(savedApplication -> {
                    PageDTO page = new PageDTO();
                    page.setName(FieldName.DEFAULT_PAGE_NAME);
                    page.setApplicationId(savedApplication.getId());
                    List<Layout> layoutList = new ArrayList<>();
                    layoutList.add(newPageService.createDefaultLayout());
                    page.setLayouts(layoutList);

                    if (page.getDefaultResources() == null) {
                        DefaultResources defaults = new DefaultResources();
                        defaults.setApplicationId(page.getApplicationId());
                        page.setDefaultResources(defaults);
                    }
                    // Set the page policies
                    generateAndSetPagePolicies(savedApplication, page);

                    return newPageService
                            .createDefault(page)
                            .flatMap(savedPage -> addPageToApplication(savedApplication, savedPage, true))
                            // Now publish this newly created app with default states so that
                            // launching of newly created application is possible.
                            .flatMap(updatedApplication -> publish(savedApplication.getId(), false)
                                    .then(applicationService.findById(
                                            savedApplication.getId(), applicationPermission.getReadPermission())));
                });
    }

    @Override
    public Mono<Application> setApplicationPolicies(Mono<User> userMono, String workspaceId, Application application) {
        return userMono.flatMap(user -> {
            Mono<Workspace> workspaceMono = workspaceRepository
                    .findById(workspaceId, workspacePermission.getApplicationCreatePermission())
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

            return workspaceMono.map(org -> {
                application.setWorkspaceId(org.getId());
                Set<Policy> documentPolicies =
                        policyGenerator.getAllChildPolicies(org.getPolicies(), Workspace.class, Application.class);
                application.setPolicies(documentPolicies);
                return application;
            });
        });
    }

    public void generateAndSetPagePolicies(Application application, PageDTO page) {
        Set<Policy> documentPolicies =
                policyGenerator.getAllChildPolicies(application.getPolicies(), Application.class, Page.class);
        page.setPolicies(documentPolicies);
    }

    /**
     * This function performs a soft delete for the application along with it's associated pages and actions.
     *
     * @param id The application id to delete
     * @return The modified application object with the deleted flag set
     */
    @Override
    public Mono<Application> deleteApplication(String id) {
        log.debug("Archiving application with id: {}", id);

        Mono<Application> applicationMono = applicationRepository
                .findById(id, applicationPermission.getDeletePermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, id)))
                .cache();

        /* As part of git sync feature a new application will be created for each branch with reference to main application
         * feat/new-branch ----> new application in Appsmith
         * Get all the applications which refer to the current application and archive those first one by one
         * GitApplicationMetadata has a field called defaultApplicationId which refers to the main application
         * */
        return applicationMono
                .flatMapMany(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    if (GitUtils.isApplicationConnectedToGit(application)) {
                        return applicationService.findAllApplicationsByDefaultApplicationId(
                                gitData.getDefaultApplicationId(), applicationPermission.getDeletePermission());
                    }
                    return Flux.fromIterable(List.of(application));
                })
                .flatMap(application -> {
                    log.debug("Archiving application with id: {}", application.getId());
                    return deleteApplicationByResource(application);
                })
                .then(applicationMono)
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    if (gitData != null
                            && !StringUtils.isEmpty(gitData.getDefaultApplicationId())
                            && !StringUtils.isEmpty(gitData.getRepoName())) {
                        String repoName = gitData.getRepoName();
                        Path repoPath =
                                Paths.get(application.getWorkspaceId(), gitData.getDefaultApplicationId(), repoName);
                        // Delete git repo from local
                        return gitFileUtils.deleteLocalRepo(repoPath).then(Mono.just(application));
                    }
                    return Mono.just(application);
                });
    }

    @Override
    public Mono<List<Application>> deleteMultipleApps(List<String> ids) {
        log.debug("Archiving application with ids: {}", ids.toString());

        return Flux.fromIterable(ids).flatMap(id -> deleteApplication(id)).collectList();
    }

    public Mono<Application> deleteApplicationByResource(Application application) {
        log.debug("Archiving actionCollections, actions, pages and themes for applicationId: {}", application.getId());
        return actionCollectionService
                .archiveActionCollectionByApplicationId(application.getId(), actionPermission.getDeletePermission())
                .then(newActionService.archiveActionsByApplicationId(
                        application.getId(), actionPermission.getDeletePermission()))
                .then(newPageService.archivePagesByApplicationId(
                        application.getId(), pagePermission.getDeletePermission()))
                .then(themeService.archiveApplicationThemes(application))
                .flatMap(applicationService::archive)
                .flatMap(deletedApplication -> {
                    final Map<String, Object> eventData = Map.of(
                            FieldName.APP_MODE,
                            ApplicationMode.EDIT.toString(),
                            FieldName.APPLICATION,
                            deletedApplication);
                    final Map<String, Object> data = Map.of(FieldName.EVENT_DATA, eventData);

                    return analyticsService.sendDeleteEvent(deletedApplication, data);
                });
    }

    @Override
    public Mono<PageDTO> clonePage(String pageId) {

        return newPageService
                .findById(pageId, pagePermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Clone Page")))
                .flatMap(page -> applicationService
                        .saveLastEditInformation(page.getApplicationId())
                        .then(clonePageGivenApplicationId(pageId, page.getApplicationId(), " Copy")));
    }

    @Override
    public Mono<PageDTO> clonePageByDefaultPageIdAndBranch(String defaultPageId, String branchName) {
        return newPageService
                .findByBranchNameAndDefaultPageId(branchName, defaultPageId, pagePermission.getEditPermission())
                .flatMap(newPage -> clonePage(newPage.getId()))
                .map(responseUtils::updatePageDTOWithDefaultResources);
    }

    private Mono<PageDTO> clonePageGivenApplicationId(
            String pageId, String applicationId, @Nullable String newPageNameSuffix) {
        // Find the source page and then prune the page layout fields to only contain the required fields that should be
        // copied.
        Mono<PageDTO> sourcePageMono = newPageService
                .findPageById(pageId, pagePermission.getEditPermission(), false)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                .flatMap(page -> Flux.fromIterable(page.getLayouts())
                        .map(layout -> {
                            Layout newLayout = new Layout();
                            String id = new ObjectId().toString();
                            newLayout.setId(id);
                            newLayout.setMongoEscapedWidgetNames(layout.getMongoEscapedWidgetNames());
                            newLayout.setDsl(layout.getDsl());
                            return newLayout;
                        })
                        .collectList()
                        .map(layouts -> {
                            page.setLayouts(layouts);
                            return page;
                        }));

        final Flux<ActionCollection> sourceActionCollectionsFlux = actionCollectionService.findByPageId(pageId);

        Flux<NewAction> sourceActionFlux = newActionService
                .findByPageId(pageId, actionPermission.getEditPermission())
                // Set collection reference in actions to null to reset to the new application's collections later
                .map(newAction -> {
                    if (newAction.getUnpublishedAction() != null) {
                        newAction.getUnpublishedAction().setCollectionId(null);
                    }
                    return newAction;
                })
                // In case there are no actions in the page being cloned, return empty
                .switchIfEmpty(Flux.empty());

        return sourcePageMono
                .flatMap(page -> {
                    Mono<ApplicationPagesDTO> pageNamesMono =
                            newPageService.findApplicationPagesByApplicationIdViewMode(
                                    page.getApplicationId(), false, false);

                    Mono<Application> destinationApplicationMono = applicationService
                            .findById(applicationId, applicationPermission.getEditPermission())
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)));

                    return Mono.zip(pageNamesMono, destinationApplicationMono)
                            // If a new page name suffix is given,
                            // set a unique name for the cloned page and then create the page.
                            .flatMap(tuple -> {
                                ApplicationPagesDTO pageNames = tuple.getT1();
                                Application application = tuple.getT2();

                                if (!Strings.isNullOrEmpty(newPageNameSuffix)) {
                                    String newPageName = page.getName() + newPageNameSuffix;

                                    Set<String> names = pageNames.getPages().stream()
                                            .map(PageNameIdDTO::getName)
                                            .collect(Collectors.toSet());

                                    int i = 0;
                                    String name = newPageName;
                                    while (names.contains(name)) {
                                        i++;
                                        name = newPageName + i;
                                    }
                                    newPageName = name;

                                    page.setName(newPageName);
                                }
                                // Proceed with creating the copy of the page
                                page.setId(null);
                                page.setApplicationId(applicationId);
                                DefaultResources defaults = new DefaultResources();
                                GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                                if (gitData != null) {
                                    defaults.setApplicationId(gitData.getDefaultApplicationId());
                                    defaults.setBranchName(gitData.getBranchName());
                                } else {
                                    defaults.setApplicationId(applicationId);
                                }
                                page.setDefaultResources(defaults);
                                return newPageService.createDefault(page);
                            });
                })
                .flatMap(clonedPage -> {
                    String newPageId = clonedPage.getId();
                    final DefaultResources clonedPageDefaultResources = clonedPage.getDefaultResources();
                    return sourceActionFlux
                            .flatMap(action -> {
                                String originalActionId = action.getId();
                                // Set new page id in the actionDTO
                                action.getUnpublishedAction().setPageId(newPageId);
                                action.getUnpublishedAction().setDefaultResources(clonedPageDefaultResources);
                                /*
                                 * - Now create the new action from the template of the source action.
                                 * - Use CLONE_PAGE context to make sure that page / application clone quirks are
                                 *   taken care of - e.g. onPageLoad setting is copied from action setting instead of
                                 *   being set to off by default.
                                 */
                                AppsmithEventContext eventContext =
                                        new AppsmithEventContext(AppsmithEventContextType.CLONE_PAGE);
                                return Mono.zip(
                                        layoutActionService
                                                .createAction(
                                                        action.getUnpublishedAction(), eventContext, Boolean.FALSE)
                                                .map(ActionDTO::getId),
                                        Mono.justOrEmpty(originalActionId));
                            })
                            .collect(
                                    HashMap<String, String>::new,
                                    (map, tuple2) -> map.put(tuple2.getT2(), tuple2.getT1()))
                            .flatMap(actionIdsMap -> {
                                // Pick all action collections
                                return sourceActionCollectionsFlux
                                        .flatMap(actionCollection -> {
                                            final ActionCollectionDTO unpublishedCollection =
                                                    actionCollection.getUnpublishedCollection();
                                            unpublishedCollection.setPageId(newPageId);
                                            actionCollection.setApplicationId(clonedPage.getApplicationId());

                                            DefaultResources defaultResources = new DefaultResources();
                                            copyNestedNonNullProperties(clonedPageDefaultResources, defaultResources);
                                            actionCollection.setDefaultResources(defaultResources);

                                            DefaultResources defaultResourcesForDTO = new DefaultResources();
                                            defaultResourcesForDTO.setPageId(clonedPageDefaultResources.getPageId());
                                            actionCollection
                                                    .getUnpublishedCollection()
                                                    .setDefaultResources(defaultResourcesForDTO);

                                            // Replace all action Ids from map
                                            Map<String, String> updatedDefaultToBranchedActionId = new HashMap<>();
                                            // Check if the application is connected with git and update
                                            // defaultActionIds accordingly
                                            //
                                            // 1. If the app is connected with git keep the actionDefaultId as it is and
                                            // update branchedActionId only
                                            //
                                            // 2. If app is not connected then both default and branchedActionId will be
                                            // same as newly created action Id

                                            if (StringUtils.isEmpty(clonedPageDefaultResources.getBranchName())) {
                                                unpublishedCollection
                                                        .getDefaultToBranchedActionIdsMap()
                                                        .forEach((defaultId, oldActionId) -> {
                                                            // Filter out the actionIds for which the reference is not
                                                            // present in cloned actions, this happens when we have
                                                            // deleted action in unpublished mode
                                                            if (StringUtils.hasLength(oldActionId)
                                                                    && StringUtils.hasLength(
                                                                            actionIdsMap.get(oldActionId))) {
                                                                updatedDefaultToBranchedActionId.put(
                                                                        actionIdsMap.get(oldActionId),
                                                                        actionIdsMap.get(oldActionId));
                                                            }
                                                        });
                                            } else {
                                                unpublishedCollection
                                                        .getDefaultToBranchedActionIdsMap()
                                                        .forEach((defaultId, oldActionId) -> {
                                                            // Filter out the actionIds for which the reference is not
                                                            // present in cloned actions, this happens when we have
                                                            // deleted action in unpublished mode
                                                            if (StringUtils.hasLength(defaultId)
                                                                    && StringUtils.hasLength(
                                                                            actionIdsMap.get(oldActionId))) {
                                                                updatedDefaultToBranchedActionId.put(
                                                                        defaultId, actionIdsMap.get(oldActionId));
                                                            }
                                                        });
                                            }
                                            unpublishedCollection.setDefaultToBranchedActionIdsMap(
                                                    updatedDefaultToBranchedActionId);

                                            // Set id as null, otherwise create (which is using under the hood save)
                                            // will try to overwrite same resource instead of creating a new resource
                                            actionCollection.setId(null);
                                            // Set published version to null as the published version of the page does
                                            // not exists when we clone the page.
                                            actionCollection.setPublishedCollection(null);
                                            actionCollection
                                                    .getDefaultResources()
                                                    .setPageId(null);
                                            // Assign new gitSyncId for cloned actionCollection
                                            actionCollection.setGitSyncId(
                                                    actionCollection.getApplicationId() + "_" + new ObjectId());
                                            return actionCollectionService
                                                    .create(actionCollection)
                                                    .flatMap(savedActionCollection -> {
                                                        if (!StringUtils.hasLength(savedActionCollection
                                                                .getDefaultResources()
                                                                .getCollectionId())) {
                                                            savedActionCollection
                                                                    .getDefaultResources()
                                                                    .setCollectionId(savedActionCollection.getId());
                                                            return actionCollectionService.update(
                                                                    savedActionCollection.getId(),
                                                                    savedActionCollection);
                                                        }
                                                        return Mono.just(savedActionCollection);
                                                    })
                                                    .flatMap(newlyCreatedActionCollection -> Flux.fromIterable(
                                                                    updatedDefaultToBranchedActionId.values())
                                                            .flatMap(newActionService::findById)
                                                            .flatMap(newlyCreatedAction -> {
                                                                newlyCreatedAction
                                                                        .getUnpublishedAction()
                                                                        .setCollectionId(
                                                                                newlyCreatedActionCollection.getId());
                                                                newlyCreatedAction
                                                                        .getUnpublishedAction()
                                                                        .getDefaultResources()
                                                                        .setCollectionId(newlyCreatedActionCollection
                                                                                .getDefaultResources()
                                                                                .getCollectionId());
                                                                return newActionService.update(
                                                                        newlyCreatedAction.getId(), newlyCreatedAction);
                                                            })
                                                            .collectList());
                                        })
                                        .collectList();
                            })
                            .thenReturn(clonedPage);
                })
                // Calculate the on load actions for this page now that the page and actions have been created
                .flatMap(savedPage -> {
                    List<Layout> layouts = savedPage.getLayouts();

                    return Flux.fromIterable(layouts)
                            .flatMap(layout -> {
                                layout.setDsl(updateLayoutService.unescapeMongoSpecialCharacters(layout));
                                return updateLayoutService.updateLayout(
                                        savedPage.getId(), savedPage.getApplicationId(), layout.getId(), layout);
                            })
                            .collectList()
                            .thenReturn(savedPage);
                })
                .flatMap(page -> {
                    Mono<Application> applicationMono = applicationService.findById(
                            page.getApplicationId(), applicationPermission.getEditPermission());
                    return applicationMono.flatMap(application -> {
                        ApplicationPage applicationPage = new ApplicationPage();
                        applicationPage.setId(page.getId());
                        applicationPage.setIsDefault(false);
                        if (StringUtils.isEmpty(page.getDefaultResources().getPageId())) {
                            applicationPage.setDefaultPageId(page.getId());
                        } else {
                            applicationPage.setDefaultPageId(
                                    page.getDefaultResources().getPageId());
                        }
                        application.getPages().add(applicationPage);
                        return applicationService.save(application).thenReturn(page);
                    });
                });
    }

    private Mono<PageDTO> clonePageGivenApplicationId(String pageId, String applicationId) {
        return clonePageGivenApplicationId(pageId, applicationId, null);
    }

    @Override
    public Mono<Application> cloneApplication(String applicationId, String branchName) {

        // 1. Find valid application to clone, depending on branch
        Mono<Application> applicationMono = applicationService
                .findByBranchNameAndDefaultApplicationId(
                        branchName, applicationId, applicationPermission.getEditPermission())
                .flatMap(application -> {
                    // For git connected application user can update the default branch
                    // In such cases we should fork the application from the new default branch
                    if (StringUtils.isEmpty(branchName)
                            && !Optional.ofNullable(application.getGitApplicationMetadata())
                                    .isEmpty()
                            && !application
                                    .getGitApplicationMetadata()
                                    .getBranchName()
                                    .equals(application
                                            .getGitApplicationMetadata()
                                            .getDefaultBranchName())) {
                        return applicationService.findByBranchNameAndDefaultApplicationId(
                                application.getGitApplicationMetadata().getDefaultBranchName(),
                                applicationId,
                                applicationPermission.getEditPermission());
                    }
                    return Mono.just(application);
                })
                .cache();

        Mono<Application> applicationPostPermissionCheckMono = Mono.when(
                        validateAllObjectsForPermissions(
                                applicationMono, AppsmithError.APPLICATION_NOT_CLONED_MISSING_PERMISSIONS),
                        validateDatasourcesForCreatePermission(applicationMono))
                .then(applicationMono);

        // 2. Find the name for the cloned application which wouldn't lead to duplicate key exception
        Mono<String> newAppNameMono = applicationPostPermissionCheckMono.flatMap(application -> applicationService
                // TODO: Convert this into a query that projects only application names
                .findAllApplicationsByWorkspaceId(application.getWorkspaceId())
                .map(Application::getName)
                .collect(Collectors.toSet())
                .map(appNames -> {
                    String newAppName = application.getName() + " Copy";
                    int i = 0;
                    String name = newAppName;
                    while (appNames.contains(name)) {
                        i++;
                        name = newAppName + i;
                    }
                    return name;
                }));

        // We don't have to sanitise the response to update the Ids with the default ones as client want child
        // application only
        Mono<Application> clonedResultMono = Mono.zip(applicationMono, newAppNameMono)
                .flatMap(tuple -> {
                    Application sourceApplication = tuple.getT1();
                    String newName = tuple.getT2();

                    // 3. Set up fields for copy of application

                    // Remove the git related data before cloning
                    sourceApplication.setGitApplicationMetadata(null);

                    // Create a new clone application object without the pages using the parameterized Application
                    // constructor
                    Application newApplication = new Application(sourceApplication);
                    newApplication.setName(newName);
                    newApplication.setLastEditedAt(Instant.now());
                    newApplication.setEvaluationVersion(sourceApplication.getEvaluationVersion());

                    if (sourceApplication.getApplicationVersion() != null) {
                        newApplication.setApplicationVersion(sourceApplication.getApplicationVersion());
                    } else {
                        newApplication.setApplicationVersion(ApplicationVersion.EARLIEST_VERSION);
                    }

                    Mono<User> userMono = sessionUserService.getCurrentUser().cache();
                    // First set the correct policies for the new cloned application
                    return setApplicationPolicies(userMono, sourceApplication.getWorkspaceId(), newApplication)
                            // Create the cloned application with the new name and policies before proceeding further.
                            .zipWith(userMono)
                            .flatMap(applicationUserTuple2 -> {
                                Application application1 = applicationUserTuple2.getT1();
                                // setting modified by to current user
                                application1.setModifiedBy(
                                        applicationUserTuple2.getT2().getUsername());
                                return applicationService.createDefaultApplication(application1);
                            })
                            // 4. Now fetch the pages of the source application, clone and add them to this new
                            // application
                            .flatMap(savedApplication -> Flux.fromIterable(sourceApplication.getPages())
                                    .flatMap(applicationPage -> {
                                        String pageId = applicationPage.getId();
                                        Boolean isDefault = applicationPage.getIsDefault();
                                        return this.clonePageGivenApplicationId(pageId, savedApplication.getId())
                                                .map(clonedPage -> {
                                                    ApplicationPage newApplicationPage = new ApplicationPage();
                                                    newApplicationPage.setId(clonedPage.getId());
                                                    newApplicationPage.setIsDefault(isDefault);
                                                    // Now set defaultPageId to current page itself
                                                    newApplicationPage.setDefaultPageId(clonedPage.getId());
                                                    return newApplicationPage;
                                                });
                                    })
                                    .collectList()
                                    // Set the cloned pages into the cloned application and save.
                                    .flatMap(clonedPages -> {
                                        savedApplication.setPages(clonedPages);
                                        return applicationService.save(savedApplication);
                                    }))
                            // 5. Duplicate the source application's themes if required i.e. if they were customized
                            .flatMap(application -> themeService
                                    .cloneThemeToApplication(sourceApplication.getEditModeThemeId(), application)
                                    .zipWith(themeService.cloneThemeToApplication(
                                            sourceApplication.getPublishedModeThemeId(), application))
                                    .flatMap(themesZip -> {
                                        String editModeThemeId =
                                                themesZip.getT1().getId();
                                        String publishedModeThemeId =
                                                themesZip.getT2().getId();
                                        application.setEditModeThemeId(editModeThemeId);
                                        application.setPublishedModeThemeId(publishedModeThemeId);
                                        return applicationService
                                                .setAppTheme(
                                                        application.getId(),
                                                        editModeThemeId,
                                                        publishedModeThemeId,
                                                        applicationPermission.getEditPermission())
                                                .thenReturn(application);
                                    }))
                            // 6. Publish copy of application
                            .flatMap(application -> publish(application.getId(), false))
                            .flatMap(application -> sendCloneApplicationAnalyticsEvent(sourceApplication, application));
                });

        // Clone Application is currently a slow API because it needs to create application, clone all the pages, and
        // then
        // clone all the actions. This process may take time and the client may cancel the request. This leads to the
        // flow
        // getting stopped midway producing corrupted clones. The following ensures that even though the client may have
        // cancelled the flow, the cloning of the application should proceed uninterrupted and whenever the user
        // refreshes
        // the page, the cloned application is available and is in sane state.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
        // means that even if the subscriber has cancelled its subscription, the create method still generates its
        // event.
        return Mono.create(sink -> clonedResultMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * This function archives the unpublished page. This also archives the unpublished action. The reason that the
     * entire action is not deleted at this point is to handle the following edge case :
     * An application is published with 1 page and 1 action.
     * Post publish, create a new page and move the action from the existing page to the new page. Now delete this newly
     * created page.
     * In this scenario, if we were to delete all actions associated with the page, we would end up deleting an action
     * which is currently in published state and is being used.
     *
     * @param id The pageId which needs to be archived.
     * @return
     */
    @Override
    public Mono<PageDTO> deleteWithoutPermissionUnpublishedPage(String id) {
        return deleteUnpublishedPageEx(id, Optional.empty());
    }

    @Override
    public Mono<PageDTO> deleteUnpublishedPage(String id) {
        return deleteUnpublishedPageEx(id, Optional.of(pagePermission.getDeletePermission()));
    }

    /**
     * This function archives the unpublished page. This also archives the unpublished action. The reason that the
     * entire action is not deleted at this point is to handle the following edge case :
     * An application is published with 1 page and 1 action.
     * Post publish, create a new page and move the action from the existing page to the new page. Now delete this newly
     * created page.
     * In this scenario, if we were to delete all actions associated with the page, we would end up deleting an action
     * which is currently in published state and is being used.
     *
     * @param id The pageId which needs to be archived.
     * @return
     */
    private Mono<PageDTO> deleteUnpublishedPageEx(String id, Optional<AclPermission> permission) {

        return newPageService
                .findById(id, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, id)))
                .flatMap(page -> {
                    log.debug(
                            "Going to archive pageId: {} for applicationId: {}", page.getId(), page.getApplicationId());
                    Mono<Application> applicationMono = applicationService
                            .getById(page.getApplicationId())
                            .flatMap(application -> {
                                application.getPages().removeIf(p -> p.getId().equals(page.getId()));
                                return applicationService.save(application);
                            });
                    Mono<NewPage> newPageMono;
                    if (page.getPublishedPage() != null) {
                        PageDTO unpublishedPage = page.getUnpublishedPage();
                        unpublishedPage.setDeletedAt(Instant.now());
                        newPageMono = newPageService.save(page);
                    } else {
                        // This page was never published. This can be safely archived.
                        newPageMono = newPageService.archive(page);
                    }

                    Mono<PageDTO> archivedPageMono = newPageMono
                            .flatMap(newPage -> {
                                final Map<String, Object> eventData =
                                        Map.of(FieldName.APP_MODE, ApplicationMode.EDIT.toString());
                                final Map<String, Object> data = Map.of(FieldName.EVENT_DATA, eventData);

                                return analyticsService.sendDeleteEvent(newPage, data);
                            })
                            .flatMap(newPage -> newPageService.getPageByViewMode(newPage, false));

                    /**
                     *  Only delete unpublished action and not the entire action. Also filter actions embedded in
                     *  actionCollection which will be deleted while deleting the collection, this will avoid the race
                     *  condition for delete action
                     */
                    Mono<List<ActionDTO>> archivedActionsMono = newActionService
                            .findByPageId(page.getId(), actionPermission.getDeletePermission())
                            .filter(newAction -> !StringUtils.hasLength(
                                    newAction.getUnpublishedAction().getCollectionId()))
                            .flatMap(action -> {
                                log.debug("Going to archive actionId: {} for applicationId: {}", action.getId(), id);
                                return newActionService.deleteUnpublishedAction(action.getId());
                            })
                            .collectList();

                    /**
                     *  Only delete unpublished action collection and not the entire action collection.
                     */
                    Mono<List<ActionCollectionDTO>> archivedActionCollectionsMono = actionCollectionService
                            .findByPageId(page.getId())
                            .flatMap(actionCollection -> {
                                log.debug(
                                        "Going to archive actionCollectionId: {} for applicationId: {}",
                                        actionCollection.getId(),
                                        id);
                                return actionCollectionService.deleteUnpublishedActionCollection(
                                        actionCollection.getId());
                            })
                            .collectList();

                    // Page is deleted only after other resources are deleted
                    return Mono.zip(archivedActionsMono, archivedActionCollectionsMono, applicationMono)
                            .map(tuple -> {
                                List<ActionDTO> actions = tuple.getT1();
                                final List<ActionCollectionDTO> actionCollections = tuple.getT2();
                                Application application = tuple.getT3();
                                log.debug(
                                        "Archived {} actions and {} action collections for applicationId: {}",
                                        actions.size(),
                                        actionCollections.size(),
                                        application.getId());
                                return application;
                            })
                            .then(archivedPageMono)
                            .map(pageDTO -> {
                                log.debug(
                                        "Archived pageId: {} for applicationId: {}",
                                        pageDTO.getId(),
                                        pageDTO.getApplicationId());
                                return pageDTO;
                            })
                            .flatMap(pageDTO ->
                                    // save the last edit information as page is deleted from application
                                    applicationService
                                            .saveLastEditInformation(pageDTO.getApplicationId())
                                            .thenReturn(pageDTO));
                });
    }

    public Mono<PageDTO> deleteUnpublishedPageByBranchAndDefaultPageId(String defaultPageId, String branchName) {
        return newPageService
                .findByBranchNameAndDefaultPageId(branchName, defaultPageId, pagePermission.getDeletePermission())
                .flatMap(newPage -> deleteUnpublishedPage(newPage.getId()))
                .map(responseUtils::updatePageDTOWithDefaultResources)
                .as(transactionalOperator::transactional);
    }

    /**
     * This function walks through all the pages in the application. In each page, it walks through all the layouts.
     * In a layout, dsl and publishedDsl JSONObjects exist. Publish function is responsible for copying the dsl into
     * the publishedDsl.
     *
     * @param applicationId The id of the application that will be published.
     * @return Publishes a Boolean true, when the application has been published.
     */
    @Override
    public Mono<Application> publish(String applicationId, boolean isPublishedManually) {
        return publishAndGetMetadata(applicationId, isPublishedManually)
                .flatMap(tuple2 -> {
                    ApplicationPublishingMetaDTO metaDTO = tuple2.getT2();
                    return sendApplicationPublishedEvent(metaDTO);
                })
                .elapsed()
                .map(objects -> {
                    log.debug(
                            "Published application {} in {} ms", objects.getT2().getId(), objects.getT1());
                    return objects.getT2();
                });
    }

    protected Mono<Tuple2<Mono<Application>, ApplicationPublishingMetaDTO>> publishAndGetMetadata(
            String applicationId, boolean isPublishedManually) {
        /*
         * Please note that it is a cached Mono, hence please be careful with using this Mono to update / read data
         * when latest updated application object is desired.
         */
        Mono<Application> applicationMono = applicationService
                .findById(applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .cache();

        Mono<Theme> publishThemeMono =
                applicationMono.flatMap(application -> themeService.publishTheme(application.getId()));

        Set<CustomJSLibContextDTO> updatedPublishedJSLibDTOs = new HashSet<>();
        Mono<List<ApplicationPage>> publishApplicationAndPages = applicationMono
                // Return all the pages in the Application
                .flatMap(application -> {
                    // Update published custom JS lib objects.
                    application.setPublishedCustomJSLibs(application.getUnpublishedCustomJSLibs());
                    if (application.getUnpublishedCustomJSLibs() != null) {
                        updatedPublishedJSLibDTOs.addAll(application.getPublishedCustomJSLibs());
                    }

                    List<ApplicationPage> pages = application.getPages();
                    if (pages == null) {
                        pages = new ArrayList<>();
                    }

                    // This is the time to delete any page which was deleted in edit mode but still exists in the
                    // published mode
                    List<ApplicationPage> publishedPages = application.getPublishedPages();
                    if (publishedPages == null) {
                        publishedPages = new ArrayList<>();
                    }
                    Set<String> publishedPageIds =
                            publishedPages.stream().map(ApplicationPage::getId).collect(Collectors.toSet());
                    Set<String> editedPageIds =
                            pages.stream().map(ApplicationPage::getId).collect(Collectors.toSet());

                    /*
                     * Now add the published page ids and edited page ids into a single set and then remove the edited
                     * page ids to get a set of page ids which have been deleted in the edit mode.
                     * For example :
                     * Published page ids : [ A, B, C ]
                     * Edited Page ids : [ B, C, D ] aka A has been deleted and D has been added
                     * Step 1. Add both the ids into a single set : [ A, B, C, D]
                     * Step 2. Remove Edited Page Ids : [ A ]
                     * Result : Page A which has been deleted in the edit mode
                     */
                    publishedPageIds.addAll(editedPageIds);
                    publishedPageIds.removeAll(editedPageIds);

                    Mono<Boolean> archivePageMono;

                    if (!publishedPageIds.isEmpty()) {
                        archivePageMono = newPageService.archiveByIds(publishedPageIds);
                    } else {
                        archivePageMono = Mono.just(Boolean.TRUE);
                    }

                    application.setPublishedPages(pages);

                    application.setPublishedAppLayout(application.getUnpublishedAppLayout());
                    application.setPublishedApplicationDetail(application.getUnpublishedApplicationDetail());

                    if (isPublishedManually) {
                        application.setLastDeployedAt(Instant.now());
                    }
                    Mono<List<BulkWriteResult>> publishPagesMono =
                            newPageService.publishPages(editedPageIds, pagePermission.getEditPermission());

                    // Archive the deleted pages and save the application changes and then return the pages so that
                    // the pages can also be published
                    return Mono.zip(archivePageMono, publishPagesMono, applicationService.save(application))
                            .thenReturn(pages);
                })
                .cache(); // caching as we'll need this to send analytics attributes after publishing the app

        Mono<List<BulkWriteResult>> publishActionsMono =
                newActionService.publishActions(applicationId, actionPermission.getEditPermission());

        // this is a map of pluginType to count of actions for that pluginType, required for analytics
        Mono<Map<PluginType, Integer>> actionCountByPluginTypeMapMono = newActionService
                .countActionsByPluginType(applicationId)
                .collectMap(PluginTypeAndCountDTO::getPluginType, PluginTypeAndCountDTO::getCount);

        Mono<List<ActionCollection>> publishedActionCollectionsListMono = actionCollectionService
                .findAllByApplicationIdAndViewMode(applicationId, false, actionPermission.getEditPermission(), null)
                .flatMap(collection -> {
                    // If the collection was deleted in edit mode, now this can be safely deleted from the repository
                    if (collection.getUnpublishedCollection().getDeletedAt() != null) {
                        return actionCollectionService
                                .archiveById(collection.getId())
                                .then(Mono.empty());
                    }
                    // Publish the collection by copying the unpublished collectionDTO to published collectionDTO
                    collection.setPublishedCollection(collection.getUnpublishedCollection());
                    return Mono.just(collection);
                })
                .flatMap(actionCollectionService::save)
                .collectList()
                .cache(); // caching because it's needed to send analytics attributes after publishing the app

        ApplicationPublishingMetaDTO applicationPublishingMetaDTO = ApplicationPublishingMetaDTO.builder()
                .applicationId(applicationId)
                .isPublishedManually(isPublishedManually)
                .applicationPagesMono(publishApplicationAndPages)
                .updatedPublishedJSLibDTOsMono(Mono.just(updatedPublishedJSLibDTOs))
                .actionCountByPluginTypeMapMono(actionCountByPluginTypeMapMono)
                .publishedActionCollectionsListMono(publishedActionCollectionsListMono)
                .build();

        return publishApplicationAndPages
                .flatMap(newPages -> Mono.zip(publishActionsMono, publishedActionCollectionsListMono, publishThemeMono))
                .then(Mono.just(Tuples.of(applicationMono, applicationPublishingMetaDTO)));
    }

    private int getActionCount(Map<PluginType, Integer> pluginTypeCollectionMap, PluginType pluginType) {
        if (pluginTypeCollectionMap.containsKey(pluginType)) {
            return pluginTypeCollectionMap.get(pluginType);
        }
        return 0;
    }

    private Mono<Application> sendApplicationPublishedEvent(ApplicationPublishingMetaDTO publishingMetaDTO) {

        Mono<List<ApplicationPage>> publishApplicationAndPages = publishingMetaDTO.getApplicationPagesMono();
        Mono<Map<PluginType, Integer>> publishedActionsFlux = publishingMetaDTO.getActionCountByPluginTypeMapMono();
        Mono<List<ActionCollection>> publishedActionsCollectionFlux =
                publishingMetaDTO.getPublishedActionCollectionsListMono();
        Mono<Set<CustomJSLibContextDTO>> publishedJSLibDTOsMono = publishingMetaDTO.getUpdatedPublishedJSLibDTOsMono();
        String applicationId = publishingMetaDTO.getApplicationId();
        boolean isPublishedManually = publishingMetaDTO.isPublishedManually();

        Mono<String> publicPermissionGroupIdMono =
                permissionGroupService.getPublicPermissionGroupId().cache();
        return Mono.zip(
                        publishApplicationAndPages,
                        publishedActionsFlux,
                        publishedActionsCollectionFlux,
                        // not using existing applicationMono because we need the latest Application after published
                        applicationService.findById(applicationId, applicationPermission.getEditPermission()),
                        publishedJSLibDTOsMono,
                        publicPermissionGroupIdMono)
                .flatMap(objects -> {
                    Application application = objects.getT4();
                    String publicPermissionGroupId = objects.getT6();
                    boolean isApplicationPublic = permissionGroupService.isEntityAccessible(
                            application,
                            applicationPermission.getReadPermission().getValue(),
                            publicPermissionGroupId);
                    Map<String, Object> extraProperties = new HashMap<>();
                    extraProperties.put("pageCount", objects.getT1().size());
                    Map<PluginType, Integer> pluginTypeCollectionMap = objects.getT2();
                    Integer dbQueryCount = getActionCount(pluginTypeCollectionMap, PluginType.DB);
                    Integer apiCount = getActionCount(pluginTypeCollectionMap, PluginType.API);
                    Integer jsFuncCount = getActionCount(pluginTypeCollectionMap, PluginType.JS);
                    Integer saasQueryCount = getActionCount(pluginTypeCollectionMap, PluginType.SAAS);
                    Integer remoteQueryCount = getActionCount(pluginTypeCollectionMap, PluginType.REMOTE);
                    Integer aiQueryCount = getActionCount(pluginTypeCollectionMap, PluginType.AI);

                    extraProperties.put("dbQueryCount", dbQueryCount);
                    extraProperties.put("apiCount", apiCount);
                    extraProperties.put("jsFuncCount", jsFuncCount);
                    extraProperties.put("saasQueryCount", saasQueryCount);
                    extraProperties.put("remoteQueryCount", remoteQueryCount);
                    extraProperties.put("aiQueryCount", aiQueryCount);
                    extraProperties.put(
                            "queryCount",
                            (dbQueryCount + apiCount + jsFuncCount + saasQueryCount + remoteQueryCount + aiQueryCount));
                    extraProperties.put("actionCollectionCount", objects.getT3().size());
                    extraProperties.put("jsLibsCount", objects.getT5().size());
                    extraProperties.put("appId", defaultIfNull(application.getId(), ""));
                    extraProperties.put("appName", defaultIfNull(application.getName(), ""));
                    extraProperties.put("orgId", defaultIfNull(application.getWorkspaceId(), ""));
                    extraProperties.put("isManual", defaultIfNull(isPublishedManually, ""));
                    extraProperties.put("publishedAt", defaultIfNull(application.getLastDeployedAt(), ""));
                    extraProperties.put("isPublic", isApplicationPublic);

                    final Map<String, Object> eventData = Map.of(
                            FieldName.APPLICATION, application, FieldName.APP_MODE, ApplicationMode.EDIT.toString());
                    extraProperties.put(FieldName.EVENT_DATA, eventData);

                    return analyticsService.sendObjectEvent(
                            AnalyticsEvents.PUBLISH_APPLICATION, application, extraProperties);
                });
    }

    @Override
    public Mono<Application> publish(String defaultApplicationId, String branchName, boolean isPublishedManually) {
        Mono<Application> applicationMono = applicationService
                .findBranchedApplicationId(branchName, defaultApplicationId, applicationPermission.getEditPermission())
                .flatMap(branchedApplicationId ->
                        applicationService.findById(branchedApplicationId, applicationPermission.getEditPermission()))
                .cache();
        return validateAllObjectsForPermissions(applicationMono, AppsmithError.UNABLE_TO_DEPLOY_MISSING_PERMISSION)
                .then(applicationMono)
                .flatMap(application -> publish(application.getId(), isPublishedManually))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    /**
     * This function walks through all the pages and reorders them and updates the order as per the user preference.
     * A page can be moved up or down from the current position and accordingly the order of the remaining page changes.
     *
     * @param defaultAppId  The id of the Application
     * @param defaultPageId Targetted page id
     * @param order         New order for the selected page
     * @return Application object with the latest order
     **/
    @Override
    public Mono<ApplicationPagesDTO> reorderPage(
            String defaultAppId, String defaultPageId, Integer order, String branchName) {
        return newPageService
                .findByBranchNameAndDefaultPageId(branchName, defaultPageId, pagePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, defaultPageId)))
                .zipWhen(branchedPage -> applicationService
                        .findById(branchedPage.getApplicationId(), applicationPermission.getEditPermission())
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultAppId))))
                .flatMap(tuple -> {
                    final NewPage branchedPage = tuple.getT1();
                    Application application = tuple.getT2();
                    // Update the order in unpublished pages here, since this should only ever happen in edit mode.
                    List<ApplicationPage> pages = application.getPages();

                    ApplicationPage foundPage = null;
                    for (final ApplicationPage page : pages) {
                        if (branchedPage.getId().equals(page.getId())) {
                            foundPage = page;
                        }
                    }

                    if (foundPage != null) {
                        pages.remove(foundPage);
                        pages.add(order, foundPage);
                    }

                    return applicationRepository
                            .setPages(application.getId(), pages)
                            .flatMap(updateResult ->
                                    sendPageOrderAnalyticsEvent(application, defaultPageId, order, branchName))
                            .then(newPageService.findApplicationPagesByApplicationIdViewMode(
                                    application.getId(), Boolean.FALSE, false));
                })
                .map(responseUtils::updateApplicationPagesDTOWithDefaultResources);
    }

    /**
     * This method will create a new suffixed application or update the existing application if there is name conflict
     *
     * @param application resource which needs to be created or updated
     * @param name        name which should be assigned to the application
     * @param suffix      extension to application name
     * @return updated application with modified name if duplicate key exception is thrown
     */
    public Mono<Application> createOrUpdateSuffixedApplication(Application application, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        application.setName(actualName);

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        Mono<Application> applicationWithPoliciesMono =
                this.setApplicationPolicies(userMono, application.getWorkspaceId(), application);
        Mono<Boolean> applicationNameTakenMono = applicationService.isApplicationNameTaken(
                actualName, application.getWorkspaceId(), MANAGE_APPLICATIONS);

        // We are taking pessimistic approach as this flow is used in import application where we are using transactions
        // which creates problem if we hit duplicate key exception
        return applicationNameTakenMono.flatMap(isNameTaken -> {
            if (isNameTaken) {
                return this.createOrUpdateSuffixedApplication(application, name, 1 + suffix);
            } else {
                return applicationWithPoliciesMono.zipWith(userMono).flatMap(tuple -> {
                    Application application1 = tuple.getT1();
                    application1.setModifiedBy(tuple.getT2().getUsername()); // setting modified by to current user
                    // We can't use create or createApplication method here as we are expecting update operation
                    // if the
                    // _id is available with application object
                    return applicationService.save(application);
                });
            }
        });
    }

    /**
     * To send analytics event for cloning an application
     *
     * @param sourceApplication The application from which cloning is done
     * @param application       The newly created application by cloning
     * @return The newly created application by cloning
     */
    private Mono<Application> sendCloneApplicationAnalyticsEvent(
            Application sourceApplication, Application application) {
        return workspaceService.getById(application.getWorkspaceId()).flatMap(workspace -> {
            final Map<String, Object> eventData = Map.of(
                    FieldName.SOURCE_APPLICATION, sourceApplication,
                    FieldName.APPLICATION, application,
                    FieldName.WORKSPACE, workspace,
                    FieldName.APP_MODE, ApplicationMode.EDIT.toString());

            final Map<String, Object> data = Map.of(
                    FieldName.SOURCE_APPLICATION_ID, sourceApplication.getId(),
                    FieldName.APPLICATION_ID, application.getId(),
                    FieldName.WORKSPACE_ID, workspace.getId(),
                    FieldName.EVENT_DATA, eventData);

            return analyticsService.sendObjectEvent(AnalyticsEvents.CLONE, application, data);
        });
    }

    /**
     * To send analytics event for page views
     *
     * @param newPage  Page being accessed
     * @param viewMode Page is accessed in view mode or not
     * @return NewPage
     */
    private Mono<NewPage> sendPageViewAnalyticsEvent(NewPage newPage, boolean viewMode) {
        String view = viewMode ? ApplicationMode.PUBLISHED.toString() : ApplicationMode.EDIT.toString();
        final Map<String, Object> eventData = Map.of(
                FieldName.PAGE, newPage,
                FieldName.APP_MODE, view);

        final Map<String, Object> data = Map.of(FieldName.EVENT_DATA, eventData);

        return analyticsService.sendObjectEvent(AnalyticsEvents.VIEW, newPage, data);
    }

    private Mono<Application> sendPageOrderAnalyticsEvent(
            Application application, String pageId, int order, String branchName) {
        final Map<String, Object> eventData =
                Map.of(FieldName.APPLICATION, application, FieldName.APP_MODE, ApplicationMode.EDIT.toString());

        final Map<String, Object> data = Map.of(
                FieldName.APPLICATION_ID,
                application.getId(),
                FieldName.WORKSPACE_ID,
                application.getWorkspaceId(),
                FieldName.PAGE_ID,
                pageId,
                FieldName.PAGE_ORDER,
                order,
                FieldName.EVENT_DATA,
                eventData,
                FieldName.BRANCH_NAME,
                defaultIfNull(branchName, ""));

        return analyticsService.sendObjectEvent(AnalyticsEvents.PAGE_REORDER, application, data);
    }

    private Mono<Boolean> validateAllObjectsForPermissions(
            Mono<Application> applicationMono, AppsmithError expectedError) {
        Flux<BaseDomain> pageFlux = applicationMono.flatMapMany(application -> newPageRepository
                .findAllByApplicationIdsWithoutPermission(List.of(application.getId()), List.of("id", "policies"))
                .flatMap(newPageRepository::setUserPermissionsInObject));
        Flux<BaseDomain> actionFlux = applicationMono.flatMapMany(application -> newActionRepository
                .findAllByApplicationIdsWithoutPermission(List.of(application.getId()), List.of("id", "policies"))
                .flatMap(newActionRepository::setUserPermissionsInObject));
        Flux<BaseDomain> actionCollectionFlux = applicationMono.flatMapMany(application -> actionCollectionRepository
                .findAllByApplicationIds(List.of(application.getId()), List.of("id", "policies"))
                .flatMap(actionCollectionRepository::setUserPermissionsInObject));

        Mono<Boolean> pagesValidatedForPermission = UserPermissionUtils.validateDomainObjectPermissionsOrError(
                pageFlux,
                FieldName.PAGE,
                permissionGroupService.getSessionUserPermissionGroupIds(),
                pagePermission.getEditPermission(),
                expectedError);
        Mono<Boolean> actionsValidatedForPermission = UserPermissionUtils.validateDomainObjectPermissionsOrError(
                actionFlux,
                FieldName.ACTION,
                permissionGroupService.getSessionUserPermissionGroupIds(),
                actionPermission.getEditPermission(),
                expectedError);
        Mono<Boolean> actionCollectionsValidatedForPermission =
                UserPermissionUtils.validateDomainObjectPermissionsOrError(
                        actionCollectionFlux,
                        FieldName.ACTION,
                        permissionGroupService.getSessionUserPermissionGroupIds(),
                        actionPermission.getEditPermission(),
                        expectedError);
        return Mono.zip(
                        pagesValidatedForPermission,
                        actionsValidatedForPermission,
                        actionCollectionsValidatedForPermission)
                .thenReturn(Boolean.TRUE);
    }

    private Mono<Boolean> validateDatasourcesForCreatePermission(Mono<Application> applicationMono) {
        Flux<BaseDomain> datasourceFlux = applicationMono
                .flatMapMany(application -> newActionRepository.findAllByApplicationIdsWithoutPermission(
                        List.of(application.getId()),
                        List.of(
                                "id",
                                fieldName(QNewAction.newAction.unpublishedAction) + "."
                                        + fieldName(QNewAction.newAction.unpublishedAction.datasource) + "."
                                        + fieldName(QNewAction.newAction.unpublishedAction.datasource.id))))
                .collectList()
                .map(actions -> {
                    return actions.stream()
                            .map(action -> action.getUnpublishedAction()
                                    .getDatasource()
                                    .getId())
                            .filter(datasourceId -> StringUtils.hasLength(datasourceId))
                            .collect(Collectors.toSet());
                })
                .flatMapMany(datasourceIds -> datasourceRepository
                        .findAllByIdsWithoutPermission(datasourceIds, List.of("id", "policies"))
                        .flatMap(datasourceRepository::setUserPermissionsInObject));

        return UserPermissionUtils.validateDomainObjectPermissionsOrError(
                        datasourceFlux,
                        FieldName.DATASOURCE,
                        permissionGroupService.getSessionUserPermissionGroupIds(),
                        datasourcePermission.getActionCreatePermission(),
                        AppsmithError.APPLICATION_NOT_CLONED_MISSING_PERMISSIONS)
                .thenReturn(Boolean.TRUE);
    }
}
