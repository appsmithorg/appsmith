package com.appsmith.server.services;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.google.common.base.Strings;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.annotation.Nullable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;

@Service
@Slf4j
public class ApplicationPageServiceImpl implements ApplicationPageService {
    private final ApplicationService applicationService;
    private final SessionUserService sessionUserService;
    private final OrganizationService organizationService;
    private final LayoutActionService layoutActionService;

    private final AnalyticsService analyticsService;
    private final PolicyGenerator policyGenerator;

    private final ApplicationRepository applicationRepository;
    private final NewPageService newPageService;
    private final NewActionService newActionService;

    public ApplicationPageServiceImpl(ApplicationService applicationService,
                                      SessionUserService sessionUserService,
                                      OrganizationService organizationService,
                                      LayoutActionService layoutActionService,
                                      AnalyticsService analyticsService,
                                      PolicyGenerator policyGenerator,
                                      ApplicationRepository applicationRepository,
                                      NewPageService newPageService,
                                      NewActionService newActionService) {
        this.applicationService = applicationService;
        this.sessionUserService = sessionUserService;
        this.organizationService = organizationService;
        this.layoutActionService = layoutActionService;
        this.analyticsService = analyticsService;
        this.policyGenerator = policyGenerator;
        this.applicationRepository = applicationRepository;
        this.newPageService = newPageService;
        this.newActionService = newActionService;
    }

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
                            .thenReturn(savedPage);
                });
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
        return applicationRepository.addPageToApplication(application.getId(), page.getId(), isDefault)
                .doOnSuccess(result -> {
                    if (result.getModifiedCount() != 1) {
                        log.error("Add page to application didn't update anything, probably because application wasn't found.");
                    }
                });
    }

    @Override
    public Mono<PageDTO> getPage(String pageId, boolean viewMode) {
        AclPermission permission = viewMode ? READ_PAGES : MANAGE_PAGES;
        return newPageService.findPageById(pageId, permission, viewMode)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)));
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

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        Mono<Application> applicationWithPoliciesMono = setApplicationPolicies(userMono, orgId, application);

        return applicationWithPoliciesMono
                .flatMap(applicationService::createDefault)
                .flatMap(savedApplication -> {

                    PageDTO page = new PageDTO();
                    page.setName(FieldName.DEFAULT_PAGE_NAME);
                    page.setApplicationId(savedApplication.getId());
                    List<Layout> layoutList = new ArrayList<>();
                    layoutList.add(newPageService.createDefaultLayout());
                    page.setLayouts(layoutList);

                    //Set the page policies
                    generateAndSetPagePolicies(savedApplication, page);

                    return newPageService
                            .createDefault(page)
                            .flatMap(savedPage -> addPageToApplication(savedApplication, savedPage, true))
                            // Now publish this newly created app with default states so that
                            // launching of newly created application is possible.
                            .flatMap(updatedApplication -> publish(savedApplication.getId())
                                    .then(applicationService.findById(savedApplication.getId(), READ_APPLICATIONS)));
                });
    }

    @Override
    public Mono<Application> setApplicationPolicies(Mono<User> userMono, String orgId, Application application) {
        return userMono
                .flatMap(user -> {
                    Mono<Organization> orgMono = organizationService.findById(orgId, ORGANIZATION_MANAGE_APPLICATIONS)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, orgId)));

                    return orgMono.map(org -> {
                        application.setOrganizationId(org.getId());
                        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(org.getPolicies(), Organization.class, Application.class);
                        application.setPolicies(documentPolicies);
                        return application;
                    });
                });
    }

    private void generateAndSetPagePolicies(Application application, PageDTO page) {
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

        Mono<Application> applicationMono = applicationService.findById(id, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, id)))
                .flatMap(application -> {
                    log.debug("Archiving pages for applicationId: {}", id);
                    return newPageService.archivePagesByApplicationId(id, MANAGE_PAGES)
                            .thenReturn(application);
                })
                .flatMap(applicationService::archive);

        return applicationMono
                .flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<PageDTO> clonePage(String pageId) {

        return newPageService.findById(pageId, MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Clone Page")))
                .flatMap(page -> clonePageGivenApplicationId(pageId, page.getApplicationId(), " Copy"));
    }

    private Mono<PageDTO> clonePageGivenApplicationId(String pageId, String applicationId,
                                                      @Nullable String newPageNameSuffix) {
        // Find the source page and then prune the page layout fields to only contain the required fields that should be
        // copied.
        Mono<PageDTO> sourcePageMono = newPageService.findPageById(pageId, MANAGE_PAGES, false)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                .flatMap(page -> Flux.fromIterable(page.getLayouts())
                        .map(layout -> layout.getDsl())
                        .map(dsl -> {
                            Layout newLayout = new Layout();
                            String id = new ObjectId().toString();
                            newLayout.setId(id);
                            newLayout.setDsl(dsl);
                            return newLayout;
                        })
                        .collectList()
                        .map(layouts -> {
                            page.setLayouts(layouts);
                            return page;
                        })
                );

        Flux<NewAction> sourceActionFlux = newActionService.findByPageId(pageId, MANAGE_ACTIONS)
                // In case there are no actions in the page being cloned, return empty
                .switchIfEmpty(Flux.empty());

        return sourcePageMono
                .flatMap(page -> {
                    Mono<ApplicationPagesDTO> pageNamesMono = newPageService
                            .findApplicationPagesByApplicationIdAndViewMode(page.getApplicationId(), false);
                    return pageNamesMono
                            // If a new page name suffix is given,
                            // set a unique name for the cloned page and then create the page.
                            .flatMap(pageNames -> {
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
                                return newPageService.createDefault(page);
                            });
                })
                .flatMap(clonedPage -> {
                    String newPageId = clonedPage.getId();
                    return sourceActionFlux
                            .flatMap(action -> {
                                // Set new page id in the actionDTO
                                action.getUnpublishedAction().setPageId(newPageId);

                                /*
                                 * - Now create the new action from the template of the source action.
                                 * - Use CLONE_PAGE context to make sure that page / application clone quirks are
                                 *   taken care of - e.g. onPageLoad setting is copied from action setting instead of
                                 *   being set to off by default.
                                 */
                                AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.CLONE_PAGE);
                                return newActionService.createAction(
                                        action.getUnpublishedAction(),
                                        eventContext
                                );
                            })
                            .collectList()
                            .thenReturn(clonedPage);
                })
                // Calculate the onload actions for this page now that the page and actions have been created
                .flatMap(savedPage -> {
                    List<Layout> layouts = savedPage.getLayouts();

                    return Flux.fromIterable(layouts)
                            .flatMap(layout -> layoutActionService.updateLayout(savedPage.getId(), layout.getId(), layout))
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
    public Mono<Application> cloneApplication(String applicationId) {

        Mono<Application> applicationMono = applicationService.findById(applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Clone Application")))
                .cache();

        // Find the name for the cloned application which wouldn't lead to duplicate key exception
        Mono<String> newAppNameMono = applicationMono
                .flatMap(application -> applicationService.findAllApplicationsByOrganizationId(application.getOrganizationId())
                        .map(application1 -> application1.getName())
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

        Mono<Application> clonedResultMono = Mono.zip(applicationMono, newAppNameMono)
                .flatMap(tuple -> {
                    Application sourceApplication = tuple.getT1();
                    String newName = tuple.getT2();

                    // Create a new clone application object without the pages using the parametrized Application constructor
                    Application newApplication = new Application(sourceApplication);
                    newApplication.setName(newName);

                    Mono<User> userMono = sessionUserService.getCurrentUser().cache();
                    // First set the correct policies for the new cloned application
                    return setApplicationPolicies(userMono, sourceApplication.getOrganizationId(), newApplication)
                            // Create the cloned application with the new name and policies before proceeding further.
                            .flatMap(applicationService::createDefault)
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
                     *  Only delete unpublished action and not the entire action.
                     */
                    Mono<List<ActionDTO>> archivedActionsMono = newActionService.findByPageId(page.getId(), MANAGE_ACTIONS)
                            .flatMap(action -> {
                                log.debug("Going to archive actionId: {} for applicationId: {}", action.getId(), id);
                                return newActionService.deleteUnpublishedAction(action.getId());
                            }).collectList();

                    return Mono.zip(archivedPageMono, archivedActionsMono, applicationMono)
                            .map(tuple -> {
                                PageDTO page1 = tuple.getT1();
                                List<ActionDTO> actions = tuple.getT2();
                                Application application = tuple.getT3();
                                log.debug("Archived pageId: {} and {} actions for applicationId: {}", page1.getId(), actions.size(), application.getId());
                                return page1;
                            });
                });
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
    public Mono<Boolean> publish(String applicationId) {
        Mono<Application> applicationMono = applicationService.findById(applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)));

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
                                .flatMap(id -> newPageService.archiveById(id))
                                .collectList();
                    } else {
                        archivePageListMono = Mono.just(new ArrayList<>());
                    }

                    application.setPublishedPages(pages);

                    application.setPublishedAppLayout(application.getUnpublishedAppLayout());

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
                .flatMapMany(actions -> newActionService.saveAll(actions));

        return Mono.zip(publishApplicationAndPages.collectList(), publishedActionsFlux.collectList())
                .map(tuple -> true);
    }

}
