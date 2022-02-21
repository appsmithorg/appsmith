package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.google.common.base.Strings;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.annotation.Nullable;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.apache.commons.lang.ObjectUtils.defaultIfNull;


@Slf4j
@RequiredArgsConstructor
public class ApplicationPageServiceCEImpl implements ApplicationPageServiceCE {

    private final ApplicationService applicationService;
    private final SessionUserService sessionUserService;
    private final OrganizationRepository organizationRepository;
    private final LayoutActionService layoutActionService;

    private final AnalyticsService analyticsService;
    private final PolicyGenerator policyGenerator;

    private final ApplicationRepository applicationRepository;
    private final NewPageService newPageService;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final GitFileUtils gitFileUtils;
    private final CommentThreadRepository commentThreadRepository;
    private final ThemeService themeService;
    private final ResponseUtils responseUtils;


    public static final Integer EVALUATION_VERSION = 2;


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

        Mono<Application> applicationMono = applicationService.findById(page.getApplicationId(), AclPermission.MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, page.getApplicationId())))
                .cache();

        Mono<PageDTO> pageMono = applicationMono
                .map(application -> {
                    generateAndSetPagePolicies(application, page);
                    if (page.getDefaultResources() == null) {
                        DefaultResources defaults = new DefaultResources();
                        defaults.setApplicationId(page.getApplicationId());
                        page.setDefaultResources(defaults);
                    }
                    return page;
                });

        return pageMono
                .flatMap(newPageService::createDefault)
                //After the page has been saved, update the application (save the page id inside the application)
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

        DefaultResources defaultResources = page.getDefaultResources() == null ? new DefaultResources() : page.getDefaultResources();
        if (StringUtils.isEmpty(defaultResources.getApplicationId())) {
            // Client will be aware of default application Id only so we are safe to assume this
            defaultResources.setApplicationId(page.getApplicationId());
        }
        defaultResources.setBranchName(branchName);
        return applicationService.findBranchedApplicationId(branchName, defaultResources.getApplicationId(), MANAGE_APPLICATIONS)
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
     * @param page Page to be added to the application. Should have an `id` already.
     * @return UpdateResult object with details on how many documents have been updated, which should be 0 or 1.
     */
    @Override
    public Mono<UpdateResult> addPageToApplication(Application application, PageDTO page, Boolean isDefault) {

        String defaultPageId = page.getDefaultResources() == null || StringUtils.isEmpty(page.getDefaultResources().getPageId())
                ? page.getId() : page.getDefaultResources().getPageId();
        if(isDuplicatePage(application, page.getId())) {
            return applicationRepository.addPageToApplication(application.getId(), page.getId(), isDefault, defaultPageId)
                    .doOnSuccess(result -> {
                        if (result.getModifiedCount() != 1) {
                            log.error("Add page to application didn't update anything, probably because application wasn't found.");
                        }
                    });
        } else{
            return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY, "Page already exists with id "+page.getId()));
        }

    }

    private Boolean isDuplicatePage(Application application, String pageId) {
        if( application.getPages() != null) {
            int count = (int) application.getPages().stream().filter(
                    applicationPage -> applicationPage.getId().equals(pageId)).count();
            if (count > 0) {
                return Boolean.FALSE;
            }
        }
        return Boolean.TRUE;
    }

    @Override
    public Mono<PageDTO> getPage(String pageId, boolean viewMode) {
        AclPermission permission = viewMode ? READ_PAGES : MANAGE_PAGES;
        return newPageService.findPageById(pageId, permission, viewMode)
                .map(newPage -> {
                    List<Layout> layouts = newPage.getLayouts();
                    if (layouts == null || layouts.isEmpty()) {
                        return newPage;
                    }
                    for (Layout layout : layouts) {
                        if (layout.getDsl() == null ||
                                layout.getMongoEscapedWidgetNames() == null ||
                                layout.getMongoEscapedWidgetNames().isEmpty()) {
                            continue;
                        }
                        layout.setDsl(layoutActionService.unescapeMongoSpecialCharacters(layout));
                    }
                    newPage.setLayouts(layouts);
                    return newPage;
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)));
    }

    @Override
    public Mono<PageDTO> getPageByBranchAndDefaultPageId(String defaultPageId, String branchName, boolean viewMode) {

        AclPermission permission = viewMode ? READ_PAGES : MANAGE_PAGES;
        return newPageService.findByBranchNameAndDefaultPageId(branchName, defaultPageId, permission)
                .flatMap(newPage -> getPage(newPage.getId(), viewMode))
                .map(responseUtils::updatePageDTOWithDefaultResources);
    }

    @Override
    public Mono<PageDTO> getPageByName(String applicationName, String pageName, boolean viewMode) {
        AclPermission appPermission;
        AclPermission pagePermission;
        if (viewMode) {
            //If view is set, then this user is trying to view the application
            appPermission = READ_APPLICATIONS;
            pagePermission = READ_PAGES;
        } else {
            appPermission = MANAGE_APPLICATIONS;
            pagePermission = MANAGE_PAGES;
        }

        return applicationService
                .findByName(applicationName, appPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE + " by application name", applicationName)))
                .flatMap(application -> newPageService.findByNameAndApplicationIdAndViewMode(pageName, application.getId(), pagePermission, viewMode))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE + " by page name", pageName)));
    }

    @Override
    public Mono<Application> makePageDefault(PageDTO page) {
        return makePageDefault(page.getApplicationId(), page.getId());
    }

    @Override
    public Mono<Application> makePageDefault(String applicationId, String pageId) {
        // Since this can only happen during edit, the page in question is unpublished page. Set the view mode accordingly
        Boolean viewMode = false;
        return newPageService.findPageById(pageId, AclPermission.MANAGE_PAGES, viewMode)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                // Check if the page actually belongs to the application.
                .flatMap(page -> {
                    if (page.getApplicationId().equals(applicationId)) {
                        return Mono.just(page);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.PAGE_DOESNT_BELONG_TO_APPLICATION, page.getName(), applicationId));
                })
                .then(applicationService.findById(applicationId, MANAGE_APPLICATIONS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(application ->
                        applicationRepository
                                .setDefaultPage(applicationId, pageId)
                                .then(applicationService.getById(applicationId))
                );
    }

    @Override
    public Mono<Application> makePageDefault(String defaultApplicationId, String defaultPageId, String branchName) {
        // TODO remove the dependency of applicationId as pageId and branch can get the exact resource
        return newPageService.findByBranchNameAndDefaultPageId(branchName, defaultPageId, MANAGE_PAGES)
                .flatMap(branchedPage -> makePageDefault(branchedPage.getApplicationId(), branchedPage.getId()))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    @Override
    public Mono<Application> createApplication(Application application) {
        return createApplication(application, application.getOrganizationId());
    }

    @Override
    public Mono<Application> createApplication(Application application, String orgId) {
        if (application.getName() == null || application.getName().trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (orgId == null || orgId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }

        application.setPublishedPages(new ArrayList<>());

        // For all new applications being created, set it to use the latest evaluation version.
        application.setEvaluationVersion(EVALUATION_VERSION);

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        Mono<Application> applicationWithPoliciesMono = setApplicationPolicies(userMono, orgId, application);

        return applicationWithPoliciesMono
                .zipWith(userMono)
                .flatMap(tuple -> {
                    Application application1 = tuple.getT1();
                    application1.setModifiedBy(tuple.getT2().getUsername()); // setting modified by to current user
                    // assign the default theme id to edit mode
                    return themeService.getDefaultThemeId().map(themeId-> {
                        application1.setEditModeThemeId(themeId);
                        application1.setPublishedModeThemeId(themeId);
                        return themeId;
                    }).then(applicationService.createDefault(application1));
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
                    //Set the page policies
                    generateAndSetPagePolicies(savedApplication, page);

                    return newPageService
                            .createDefault(page)
                            .flatMap(savedPage -> addPageToApplication(savedApplication, savedPage, true))
                            // Now publish this newly created app with default states so that
                            // launching of newly created application is possible.
                            .flatMap(updatedApplication -> publish(savedApplication.getId(), false)
                                    .then(applicationService.findById(savedApplication.getId(), READ_APPLICATIONS)));
                });
    }

    @Override
    public Mono<Application> setApplicationPolicies(Mono<User> userMono, String orgId, Application application) {
        return userMono
                .flatMap(user -> {
                    Mono<Organization> orgMono = organizationRepository.findById(orgId, ORGANIZATION_MANAGE_APPLICATIONS)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, orgId)));

                    return orgMono.map(org -> {
                        application.setOrganizationId(org.getId());
                        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(org.getPolicies(), Organization.class, Application.class);
                        application.setPolicies(documentPolicies);
                        return application;
                    });
                });
    }

    public void generateAndSetPagePolicies(Application application, PageDTO page) {
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(application.getPolicies(), Application.class, Page.class);
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

        Mono<Application> applicationMono = applicationRepository.findById(id, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, id)))
                .cache();

        /* As part of git sync feature a new application will be created for each branch with reference to main application
         * feat/new-branch ----> new application in Appsmith
         * Get all the applications which refer to the current application and archive those first one by one
         * GitApplicationMetadata has a field called defaultApplicationId which refers to the main application
         * */
        return applicationMono
                .flatMapMany(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    if (gitData != null && !StringUtils.isEmpty(gitData.getDefaultApplicationId()) && !StringUtils.isEmpty(gitData.getRepoName())) {
                        String repoName = gitData.getRepoName();
                        Path repoPath = Paths.get(application.getOrganizationId(), gitData.getDefaultApplicationId(), repoName);
                        // Delete git repo from local and delete the applications from DB
                        return gitFileUtils.detachRemote(repoPath)
                                .flatMapMany(isCleared -> applicationService
                                        .findAllApplicationsByDefaultApplicationId(gitData.getDefaultApplicationId()));
                    }
                    return Flux.fromIterable(List.of(application));
                })
                .flatMap(application -> {
                    log.debug("Archiving application with id: {}", application.getId());
                    return deleteApplicationByResource(application);
                })
                .then(applicationMono);
    }

    public Mono<Application> deleteApplicationByResource(Application application) {
        log.debug("Archiving pages for applicationId: {}", application.getId());
        return Mono.when(newPageService.archivePagesByApplicationId(application.getId(), MANAGE_PAGES),
                        newActionService.archiveActionsByApplicationId(application.getId(), MANAGE_ACTIONS))
                .thenReturn(application)
                .flatMap(applicationService::archive)
                .flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<PageDTO> clonePage(String pageId) {

        return newPageService.findById(pageId, MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Clone Page")))
                .flatMap(page ->
                        applicationService.saveLastEditInformation(page.getApplicationId())
                                .then(clonePageGivenApplicationId(pageId, page.getApplicationId(), " Copy"))
                );
    }

    @Override
    public Mono<PageDTO> clonePageByDefaultPageIdAndBranch(String defaultPageId, String branchName) {
        return newPageService.findByBranchNameAndDefaultPageId(branchName, defaultPageId, MANAGE_PAGES)
                .flatMap(newPage -> clonePage(newPage.getId()))
                .map(responseUtils::updatePageDTOWithDefaultResources);
    }

    private Mono<PageDTO> clonePageGivenApplicationId(String pageId,
                                                      String applicationId,
                                                      @Nullable String newPageNameSuffix) {
        // Find the source page and then prune the page layout fields to only contain the required fields that should be
        // copied.
        Mono<PageDTO> sourcePageMono = newPageService.findPageById(pageId, MANAGE_PAGES, false)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
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
                        })
                );

        final Flux<ActionCollection> sourceActionCollectionsFlux = actionCollectionService.findByPageId(pageId);

        Flux<NewAction> sourceActionFlux = newActionService.findByPageId(pageId, MANAGE_ACTIONS)
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
                    Mono<ApplicationPagesDTO> pageNamesMono = newPageService
                            .findApplicationPagesByApplicationIdViewMode(page.getApplicationId(), false, false);

                    Mono<Application> destinationApplicationMono = applicationService.findById(applicationId, MANAGE_APPLICATIONS)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)));

                    return Mono.zip(pageNamesMono, destinationApplicationMono)
                            // If a new page name suffix is given,
                            // set a unique name for the cloned page and then create the page.
                            .flatMap(tuple -> {
                                ApplicationPagesDTO pageNames = tuple.getT1();
                                Application application = tuple.getT2();

                                if (!Strings.isNullOrEmpty(newPageNameSuffix)) {
                                    String newPageName = page.getName() + newPageNameSuffix;

                                    Set<String> names = pageNames.getPages()
                                            .stream()
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
                                AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.CLONE_PAGE);
                                return Mono.zip(layoutActionService.createAction(
                                                        action.getUnpublishedAction(),
                                                        eventContext)
                                                .map(ActionDTO::getId),
                                        Mono.justOrEmpty(originalActionId)
                                );
                            })
                            .collect(HashMap<String, String>::new, (map, tuple2) -> map.put(tuple2.getT2(), tuple2.getT1()))
                            .flatMap(actionIdsMap -> {
                                // Pick all action collections
                                return sourceActionCollectionsFlux
                                        .flatMap(actionCollection -> {
                                            final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
                                            unpublishedCollection.setPageId(newPageId);
                                            actionCollection.setApplicationId(clonedPage.getApplicationId());

                                            DefaultResources defaultResourcesForCollection = new DefaultResources();
                                            defaultResourcesForCollection.setApplicationId(clonedPageDefaultResources.getApplicationId());
                                            actionCollection.setDefaultResources(defaultResourcesForCollection);

                                            DefaultResources defaultResourcesForDTO = new DefaultResources();
                                            defaultResourcesForDTO.setPageId(clonedPageDefaultResources.getPageId());
                                            actionCollection.getUnpublishedCollection().setDefaultResources(defaultResourcesForDTO);

                                            // Replace all action Ids from map
                                            Map<String, String> updatedDefaultToBranchedActionId = new HashMap<>();
                                            // Check if the application is connected with git and update defaultActionIds accordingly
                                            //
                                            // 1. If the app is connected with git keep the actionDefaultId as it is and
                                            // update branchedActionId only
                                            //
                                            // 2. If app is not connected then both default and branchedActionId will be
                                            // same as newly created action Id

                                            if (StringUtils.isEmpty(clonedPageDefaultResources.getBranchName())) {
                                                unpublishedCollection
                                                        .getDefaultToBranchedActionIdsMap()
                                                        .forEach((defaultId, oldActionId) ->
                                                                updatedDefaultToBranchedActionId.put(actionIdsMap.get(oldActionId), actionIdsMap.get(oldActionId)));

                                            } else {
                                                unpublishedCollection
                                                        .getDefaultToBranchedActionIdsMap()
                                                        .forEach((defaultId, oldActionId) ->
                                                                updatedDefaultToBranchedActionId.put(defaultId, actionIdsMap.get(oldActionId)));
                                            }
                                            unpublishedCollection.setDefaultToBranchedActionIdsMap(updatedDefaultToBranchedActionId);

                                            // Set id as null, otherwise create (which is using under the hood save)
                                            // will try to overwrite same resource instead of creating a new resource
                                            actionCollection.setId(null);
                                            // Set published version to null as the published version of the page does
                                            // not exists when we clone the page.
                                            actionCollection.setPublishedCollection(null);
                                            return actionCollectionService.create(actionCollection)
                                                    .flatMap(savedActionCollection -> {
                                                        if (StringUtils.isEmpty(savedActionCollection.getDefaultResources().getCollectionId())) {
                                                            savedActionCollection.getDefaultResources().setCollectionId(savedActionCollection.getId());
                                                            return actionCollectionService.update(savedActionCollection.getId(), savedActionCollection);
                                                        }
                                                        return Mono.just(savedActionCollection);
                                                    })
                                                    .flatMap(newlyCreatedActionCollection ->
                                                            Flux.fromIterable(updatedDefaultToBranchedActionId.values())
                                                                .flatMap(newActionService::findById)
                                                                .flatMap(newlyCreatedAction -> {
                                                                    newlyCreatedAction.getUnpublishedAction().setCollectionId(newlyCreatedActionCollection.getId());
                                                                    newlyCreatedAction.getUnpublishedAction().getDefaultResources()
                                                                            .setCollectionId(newlyCreatedActionCollection.getDefaultResources().getCollectionId());
                                                                    return newActionService.update(newlyCreatedAction.getId(), newlyCreatedAction);
                                                                })
                                                                .collectList()
                                                    );
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
                                layout.setDsl(layoutActionService.unescapeMongoSpecialCharacters(layout));
                                return layoutActionService.updateLayout(savedPage.getId(), layout.getId(), layout);
                            })
                            .collectList()
                            .thenReturn(savedPage);
                })
                .flatMap(page -> {
                    Mono<Application> applicationMono = applicationService.findById(page.getApplicationId(), MANAGE_APPLICATIONS);
                    return applicationMono
                            .flatMap(application -> {
                                ApplicationPage applicationPage = new ApplicationPage();
                                applicationPage.setId(page.getId());
                                applicationPage.setIsDefault(false);
                                if (StringUtils.isEmpty(page.getDefaultResources().getPageId())) {
                                    applicationPage.setDefaultPageId(page.getId());
                                } else {
                                    applicationPage.setDefaultPageId(page.getDefaultResources().getPageId());
                                }
                                application.getPages().add(applicationPage);
                                return applicationService.save(application)
                                        .thenReturn(page);
                            });
                });
    }

    private Mono<PageDTO> clonePageGivenApplicationId(String pageId, String applicationId) {
        return clonePageGivenApplicationId(pageId, applicationId, null);
    }

    @Override
    public Mono<Application> cloneApplication(String applicationId, String branchName) {

        Mono<Application> applicationMono = applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, MANAGE_APPLICATIONS)
                .cache();

        // Find the name for the cloned application which wouldn't lead to duplicate key exception
        Mono<String> newAppNameMono = applicationMono
                .flatMap(application -> applicationService.findAllApplicationsByOrganizationId(application.getOrganizationId())
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

        // We don't have to sanitise the response to update the Ids with the default ones as client want child application only
        Mono<Application> clonedResultMono = Mono.zip(applicationMono, newAppNameMono)
                .flatMap(tuple -> {
                    Application sourceApplication = tuple.getT1();
                    String newName = tuple.getT2();

                    // Remove the git related data before cloning
                    sourceApplication.setGitApplicationMetadata(null);

                    // Create a new clone application object without the pages using the parameterized Application constructor
                    Application newApplication = new Application(sourceApplication);
                    newApplication.setName(newName);
                    newApplication.setLastEditedAt(Instant.now());
                    newApplication.setEvaluationVersion(sourceApplication.getEvaluationVersion());
                    Mono<User> userMono = sessionUserService.getCurrentUser().cache();
                    // First set the correct policies for the new cloned application
                    return setApplicationPolicies(userMono, sourceApplication.getOrganizationId(), newApplication)
                            // Create the cloned application with the new name and policies before proceeding further.
                            .zipWith(userMono)
                            .flatMap(applicationUserTuple2 -> {
                                Application application1 = applicationUserTuple2.getT1();
                                application1.setModifiedBy(applicationUserTuple2.getT2().getUsername()); // setting modified by to current user
                                return applicationService.createDefault(application1);
                            })
                            // duplicate the source application's themes if required i.e. if they were customized
                            .flatMap(application ->
                                    themeService.cloneThemeToApplication(sourceApplication.getEditModeThemeId(), application.getId())
                                            .zipWith(themeService.cloneThemeToApplication(sourceApplication.getPublishedModeThemeId(), application.getId()))
                                            .map(themesZip -> {
                                                application.setEditModeThemeId(themesZip.getT1().getId());
                                                application.setPublishedModeThemeId(themesZip.getT2().getId());
                                                return application;
                                            })
                            )
                            // Now fetch the pages of the source application, clone and add them to this new application
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
                                    })
                            );
                });

        // Clone Application is currently a slow API because it needs to create application, clone all the pages, and then
        // clone all the actions. This process may take time and the client may cancel the request. This leads to the flow
        // getting stopped mid way producing corrupted clones. The following ensures that even though the client may have
        // cancelled the flow, the cloning of the application should proceed uninterrupted and whenever the user refreshes
        // the page, the cloned application is available and is in sane state.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
        // means that even if the subscriber has cancelled its subscription, the create method still generates its event.
        return Mono.create(sink -> clonedResultMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
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
    public Mono<PageDTO> deleteUnpublishedPage(String id) {

        return newPageService.findById(id, AclPermission.MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, id)))
                .flatMap(page -> {
                    log.debug("Going to archive pageId: {} for applicationId: {}", page.getId(), page.getApplicationId());
                    Mono<Application> applicationMono = applicationService.getById(page.getApplicationId())
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
                            .flatMap(analyticsService::sendDeleteEvent)
                            .flatMap(newPage -> newPageService.getPageByViewMode(newPage, false));

                    /**
                     *  Only delete unpublished action and not the entire action. Also filter actions embedded in
                     *  actionCollection which will be deleted while deleting the collection, this will avoid the race
                     *  condition for delete action
                     */
                    Mono<List<ActionDTO>> archivedActionsMono = newActionService.findByPageId(page.getId(), MANAGE_ACTIONS)
                            .filter(newAction -> !StringUtils.hasLength(newAction.getUnpublishedAction().getCollectionId()))
                            .flatMap(action -> {
                                log.debug("Going to archive actionId: {} for applicationId: {}", action.getId(), id);
                                return newActionService.deleteUnpublishedAction(action.getId());
                            }).collectList();

                    Mono<UpdateResult> archiveCommentThreadMono = commentThreadRepository.archiveByPageId(
                            id, ApplicationMode.EDIT
                    );

                    /**
                     *  Only delete unpublished action collection and not the entire action collection.
                     */
                    Mono<List<ActionCollectionDTO>> archivedActionCollectionsMono = actionCollectionService.findByPageId(page.getId())
                            .flatMap(actionCollection -> {
                                log.debug("Going to archive actionCollectionId: {} for applicationId: {}", actionCollection.getId(), id);
                                return actionCollectionService.deleteUnpublishedActionCollection(actionCollection.getId());
                            }).collectList();

                    return Mono.zip(archivedPageMono, archivedActionsMono, archivedActionCollectionsMono, applicationMono, archiveCommentThreadMono)
                            .map(tuple -> {
                                PageDTO page1 = tuple.getT1();
                                List<ActionDTO> actions = tuple.getT2();
                                final List<ActionCollectionDTO> actionCollections = tuple.getT3();
                                Application application = tuple.getT4();
                                log.debug("Archived pageId: {} , {} actions and {} action collections for applicationId: {}", page1.getId(), actions.size(), actionCollections.size(), application.getId());
                                return page1;
                            })
                            .flatMap(pageDTO ->
                                    // save the last edit information as page is deleted from application
                                    applicationService.saveLastEditInformation(pageDTO.getApplicationId())
                                            .thenReturn(pageDTO)
                            );
                });
    }

    public Mono<PageDTO> deleteUnpublishedPageByBranchAndDefaultPageId(String defaultPageId, String branchName) {
        return newPageService.findByBranchNameAndDefaultPageId(branchName, defaultPageId, MANAGE_PAGES)
                .flatMap(newPage -> deleteUnpublishedPage(newPage.getId()))
                .map(responseUtils::updatePageDTOWithDefaultResources);
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
        Mono<Application> applicationMono = applicationService.findById(applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .cache();

        Mono<Theme> publishThemeMono = applicationMono.flatMap(application ->  themeService.publishTheme(
                application.getEditModeThemeId(), application.getPublishedModeThemeId(), application.getId()
        ));

        Flux<NewPage> publishApplicationAndPages = applicationMono
                //Return all the pages in the Application
                .flatMap(application -> {
                    List<ApplicationPage> pages = application.getPages();
                    if (pages == null) {
                        pages = new ArrayList<>();
                    }

                    // This is the time to delete any page which was deleted in edit mode but still exists in the published mode
                    List<ApplicationPage> publishedPages = application.getPublishedPages();
                    if (publishedPages == null) {
                        publishedPages = new ArrayList<>();
                    }
                    Set<String> publishedPageIds = publishedPages.stream().map(applicationPage -> applicationPage.getId()).collect(Collectors.toSet());
                    Set<String> editedPageIds = pages.stream().map(applicationPage -> applicationPage.getId()).collect(Collectors.toSet());

                    /**
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

                    Mono<List<Boolean>> archivePageListMono;
                    if (!publishedPageIds.isEmpty()) {
                        archivePageListMono = Flux.fromStream(publishedPageIds.stream())
                                .flatMap(id -> commentThreadRepository.archiveByPageId(id, ApplicationMode.PUBLISHED)
                                        .then(newPageService.archiveById(id))
                                )
                                .collectList();
                    } else {
                        archivePageListMono = Mono.just(new ArrayList<>());
                    }

                    application.setPublishedPages(pages);

                    application.setPublishedAppLayout(application.getUnpublishedAppLayout());
                    if(isPublishedManually) {
                        application.setLastDeployedAt(Instant.now());
                    }
                    // Archive the deleted pages and save the application changes and then return the pages so that
                    // the pages can also be published
                    return Mono.zip(archivePageListMono, applicationService.save(application))
                            .thenReturn(pages);
                })
                .flatMapMany(Flux::fromIterable)
                //In each page, copy each layout's dsl to publishedDsl field
                .flatMap(applicationPage -> newPageService
                        .findById(applicationPage.getId(), MANAGE_PAGES)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, applicationPage.getId())))
                        .map(page -> {
                            page.setPublishedPage(page.getUnpublishedPage());
                            return page;
                        }))
                .collectList()
                .flatMapMany(newPageService::saveAll);

        Flux<NewAction> publishedActionsFlux = newActionService
                .findAllByApplicationIdAndViewMode(applicationId, false, MANAGE_ACTIONS, null)
                .flatMap(newAction -> {
                    // If the action was deleted in edit mode, now this can be safely deleted from the repository
                    if (newAction.getUnpublishedAction().getDeletedAt() != null) {
                        return newActionService.delete(newAction.getId())
                                .then(Mono.empty());
                    }
                    // Publish the action by copying the unpublished actionDTO to published actionDTO
                    newAction.setPublishedAction(newAction.getUnpublishedAction());
                    return Mono.just(newAction);
                })
                .collectList()
                .flatMapMany(newActionService::saveAll);

        Flux<ActionCollection> publishedCollectionsFlux = actionCollectionService
                .findAllByApplicationIdAndViewMode(applicationId, false, MANAGE_ACTIONS, null)
                .flatMap(collection -> {
                    // If the collection was deleted in edit mode, now this can be safely deleted from the repository
                    if (collection.getUnpublishedCollection().getDeletedAt() != null) {
                        return actionCollectionService.delete(collection.getId())
                                .then(Mono.empty());
                    }
                    // Publish the collection by copying the unpublished collectionDTO to published collectionDTO
                    collection.setPublishedCollection(collection.getUnpublishedCollection());
                    return Mono.just(collection);
                })
                .collectList()
                .flatMapMany(actionCollectionService::saveAll);

        return Mono.when(
                        publishApplicationAndPages.collectList(),
                        publishedActionsFlux.collectList(),
                        publishedCollectionsFlux,
                        publishThemeMono
                )
                .then(applicationMono);
    }

    @Override
    public Mono<Application> publish(String defaultApplicationId, String branchName, boolean isPublishedManually) {
        return applicationService.findBranchedApplicationId(branchName, defaultApplicationId, MANAGE_APPLICATIONS)
                .flatMap(branchedApplicationId -> publish(branchedApplicationId, isPublishedManually))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    @Override
    public Mono<Void> sendApplicationPublishedEvent(Application application) {
        if (!analyticsService.isActive()) {
            return Mono.empty();
        }

        return sessionUserService.getCurrentUser()
                .flatMap(user -> {
                    analyticsService.sendEvent(
                            AnalyticsEvents.PUBLISH_APPLICATION.getEventName(),
                            user.getUsername(),
                            Map.of(
                                    "appId", defaultIfNull(application.getId(), ""),
                                    "appName", defaultIfNull(application.getName(), "")
                            )
                    );
                    return Mono.empty();
                });
    }

    /** This function walks through all the pages and reorders them and updates the order as per the user preference.
     * A page can be moved up or down from the current position and accordingly the order of the remaining page changes.
     * @param defaultAppId The id of the Application
     * @param defaultPageId Targetted page id
     * @param order New order for the selected page
     * @return Application object with the latest order
     **/
    @Override
    public Mono<ApplicationPagesDTO> reorderPage(String defaultAppId, String defaultPageId, Integer order, String branchName) {
        return newPageService.findByBranchNameAndDefaultPageId(branchName, defaultPageId, MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, defaultPageId)))
                .zipWhen(branchedPage -> applicationService.findById(branchedPage.getApplicationId(), MANAGE_APPLICATIONS)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultAppId))))
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

                    if(foundPage != null) {
                        pages.remove(foundPage);
                        pages.add(order, foundPage);
                    }

                    return applicationRepository
                            .setPages(application.getId(), pages)
                            .then(newPageService.findApplicationPagesByApplicationIdViewMode(application.getId(), Boolean.FALSE, false));
                })
                .map(responseUtils::updateApplicationPagesDTOWithDefaultResources);
    }

    /**
     * This method will create a new suffixed application or update the existing application if there is name conflict
     * @param application resource which needs to be created or updated
     * @param name name which should be assigned to the application
     * @param suffix extension to application name
     * @return updated application with modified name if duplicate key exception is thrown
     */
    public Mono<Application> createOrUpdateSuffixedApplication(Application application, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        application.setName(actualName);

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        Mono<Application> applicationWithPoliciesMono = this.setApplicationPolicies(userMono, application.getOrganizationId(), application);

        return applicationWithPoliciesMono
                .zipWith(userMono)
                .flatMap(tuple -> {
                    Application application1 = tuple.getT1();
                    application1.setModifiedBy(tuple.getT2().getUsername()); // setting modified by to current user
                    // We can't use create or createApplication method here as we are expecting update operation if the
                    // _id is available with application object
                    return applicationService.save(application);
                })
                .onErrorResume(DuplicateKeyException.class, error -> {
                    if (error.getMessage() != null) {
                        return this.createOrUpdateSuffixedApplication(application, name, 1 + suffix);
                    }
                    throw error;
                });
    }


}
