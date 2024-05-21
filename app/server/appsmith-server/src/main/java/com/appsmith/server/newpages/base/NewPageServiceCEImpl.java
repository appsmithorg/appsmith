package com.appsmith.server.newpages.base;

import com.appsmith.external.enums.WorkspaceResourceContext;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.dtos.PageUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.bson.types.ObjectId;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.exceptions.AppsmithError.INVALID_PARAMETER;

@Slf4j
public class NewPageServiceCEImpl extends BaseService<NewPageRepository, NewPage, String> implements NewPageServiceCE {

    private final ApplicationService applicationService;
    private final UserDataService userDataService;
    private final ResponseUtils responseUtils;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;

    @Autowired
    public NewPageServiceCEImpl(
            Validator validator,
            NewPageRepository repository,
            AnalyticsService analyticsService,
            ApplicationService applicationService,
            UserDataService userDataService,
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission) {
        super(validator, repository, analyticsService);
        this.applicationService = applicationService;
        this.userDataService = userDataService;
        this.responseUtils = responseUtils;
        this.applicationPermission = applicationPermission;
        this.pagePermission = pagePermission;
    }

    @Override
    public Mono<PageDTO> getPageByViewMode(NewPage newPage, Boolean viewMode) {

        PageDTO page = null;
        if (Boolean.TRUE.equals(viewMode)) {
            if (newPage.getPublishedPage() != null) {
                page = newPage.getPublishedPage();
                page.setName(newPage.getPublishedPage().getName());
            } else {
                // We are trying to fetch published page but it doesnt exist because the page hasn't been published yet
                return Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, newPage.getId()));
            }
        } else {
            if (newPage.getUnpublishedPage() != null) {
                page = newPage.getUnpublishedPage();
                page.setName(newPage.getUnpublishedPage().getName());
                page.setLastUpdatedTime(newPage.getUpdatedAt().getEpochSecond());
            }
        }

        if (page != null) {
            page.setDefaultResources(newPage.getDefaultResources());
            page.setId(newPage.getId());
            page.setApplicationId(newPage.getApplicationId());
            page.setUserPermissions(newPage.getUserPermissions());
            page.setPolicies(newPage.getPolicies());
            page.setDefaultResources(newPage.getDefaultResources());
            return Mono.just(page);
        }

        // We shouldn't reach here.
        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
    }

    @Override
    public Mono<NewPage> findById(String pageId, AclPermission aclPermission) {
        return repository.findById(pageId, aclPermission);
    }

    @Override
    public Mono<PageDTO> findPageById(String pageId, AclPermission aclPermission, Boolean view) {
        return this.findById(pageId, aclPermission).flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Mono<NewPage> findById(String pageId, Optional<AclPermission> aclPermission) {
        return repository.findById(pageId, aclPermission);
    }

    @Override
    public Flux<PageDTO> findByApplicationId(String applicationId, AclPermission permission, Boolean view) {
        return findNewPagesByApplicationId(applicationId, permission).flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Mono<NewPage> findByIdAndBranchName(String id, String branchName) {
        return this.findByBranchNameAndDefaultPageId(branchName, id, pagePermission.getReadPermission())
                .map(responseUtils::updateNewPageWithDefaultResources);
    }

    @Override
    public Mono<PageDTO> saveUnpublishedPage(PageDTO page) {

        return findById(page.getId(), pagePermission.getEditPermission())
                .flatMap(newPage -> {
                    newPage.setUnpublishedPage(page);
                    // gitSyncId will be used to sync resource across instances
                    if (newPage.getGitSyncId() == null) {
                        newPage.setGitSyncId(page.getApplicationId() + "_" + UUID.randomUUID());
                    }
                    return repository.save(newPage);
                })
                .flatMap(savedPage -> getPageByViewMode(savedPage, false));
    }

    @Override
    public Mono<PageDTO> createDefault(PageDTO object) {
        NewPage newPage = new NewPage();
        newPage.setUnpublishedPage(object);
        newPage.setApplicationId(object.getApplicationId());
        newPage.getUnpublishedPage().setSlug(TextUtils.makeSlug(object.getName()));
        newPage.setPolicies(object.getPolicies());
        if (newPage.getGitSyncId() == null) {
            // Make sure gitSyncId will be unique
            newPage.setGitSyncId(newPage.getApplicationId() + "_" + UUID.randomUUID());
        }
        DefaultResources defaultResources = object.getDefaultResources();
        newPage.setDefaultResources(defaultResources);
        // Save page and update the defaultPageId after insertion
        return super.create(newPage)
                .flatMap(savedPage -> {
                    if (defaultResources == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "page", savedPage.getId()));
                    }
                    if (StringUtils.isEmpty(defaultResources.getPageId())) {
                        NewPage updatePage = new NewPage();
                        defaultResources.setPageId(savedPage.getId());
                        updatePage.setDefaultResources(defaultResources);
                        return super.update(savedPage.getId(), updatePage);
                    }
                    return Mono.just(savedPage);
                })
                .flatMap(repository::setUserPermissionsInObject)
                .flatMap(page -> getPageByViewMode(page, false));
    }

    @Override
    public Mono<PageDTO> findByIdAndLayoutsId(
            String pageId, String layoutId, AclPermission aclPermission, Boolean view) {
        return repository
                .findByIdAndLayoutsIdAndViewMode(pageId, layoutId, aclPermission, view)
                .flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Mono<PageDTO> findByNameAndViewMode(String name, AclPermission permission, Boolean view) {
        return repository.findByNameAndViewMode(name, permission, view).flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Layout createDefaultLayout() {
        Layout layout = new Layout();
        String id = new ObjectId().toString();
        layout.setId(id);
        try {
            layout.setDsl((JSONObject) new JSONParser(JSONParser.MODE_PERMISSIVE).parse(FieldName.DEFAULT_PAGE_LAYOUT));
            layout.setWidgetNames(Set.of(FieldName.DEFAULT_WIDGET_NAME));
        } catch (ParseException e) {
            log.error("Unable to set the default page layout for generated id: {}", id);
        }
        return layout;
    }

    @Override
    public Mono<Void> deleteAll() {
        return repository.deleteAll();
    }

    @Override
    public Mono<ApplicationPagesDTO> findApplicationPagesByApplicationIdViewMode(
            String applicationId, Boolean view, boolean markApplicationAsRecentlyAccessed) {

        AclPermission permission = Boolean.TRUE.equals(view)
                ? applicationPermission.getReadPermission()
                : applicationPermission.getEditPermission();

        Mono<Application> applicationMono = applicationService
                .findById(applicationId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(application -> {
                    if (!Boolean.TRUE.equals(view)) {
                        return Mono.just(application);
                    }

                    if (application.getPublishedPages() == null
                            || application.getPublishedPages().isEmpty()) {
                        // We are trying to fetch published pages but they don't exist because the application
                        // hasn't been published yet

                        // Throw a 404 error if the application has never been published
                        return Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                FieldName.PUBLISHED_APPLICATION,
                                application.getId()));
                    }

                    return Mono.just(application);
                })
                .flatMap(application -> {
                    log.debug("Fetched application data for id: {}", applicationId);
                    if (markApplicationAsRecentlyAccessed) {
                        // add this application and workspace id to the recently used list in UserData
                        return userDataService
                                .updateLastUsedResourceAndWorkspaceList(
                                        application.getId(),
                                        application.getWorkspaceId(),
                                        WorkspaceResourceContext.APPLICATIONS)
                                .thenReturn(application);
                    } else {
                        return Mono.just(application);
                    }
                })
                .cache();

        return applicationMono
                .map(application -> {
                    List<ApplicationPage> pages = getApplicationPages(application, view);
                    return pages.stream().map(page -> page.getId()).collect(Collectors.toList());
                })
                .flatMapMany(pageIds -> repository.findAllPageDTOsByIds(pageIds, pagePermission.getReadPermission()))
                .collectList()
                .zipWith(applicationMono)
                .map(tuple -> {
                    log.debug("Retrieved Page DTOs from DB ...");
                    List<NewPage> pagesFromDb = tuple.getT1();
                    Application application = tuple.getT2();
                    return getApplicationPagesDTO(application, pagesFromDb, view);
                });
    }

    /**
     * Creates applicationPagesDTO and then updates the resources with default resources
     *
     * @param branchedApplication : branched application
     * @param newPages            : list of pages for the given mode
     * @param viewMode            : is application in viewMode
     * @param markRecentlyAccessed  : is
     * @return : returns the getApplicationPagesDTO
     */
    @Override
    public Mono<ApplicationPagesDTO> createApplicationPagesDTO(
            Application branchedApplication, List<NewPage> newPages, boolean viewMode, boolean markRecentlyAccessed) {

        Mono<Void> markedRecentlyAccessedMono = Mono.empty();

        if (Boolean.TRUE.equals(markRecentlyAccessed)) {
            markedRecentlyAccessedMono = userDataService
                    .updateLastUsedResourceAndWorkspaceList(
                            branchedApplication.getId(),
                            branchedApplication.getWorkspaceId(),
                            WorkspaceResourceContext.APPLICATIONS)
                    .then();
        }

        return markedRecentlyAccessedMono
                .then(Mono.fromCallable(() -> getApplicationPagesDTO(branchedApplication, newPages, viewMode)))
                .map(responseUtils::updateApplicationPagesDTOWithDefaultResources);
    }

    private List<ApplicationPage> getApplicationPages(Application application, boolean viewMode) {
        return Boolean.TRUE.equals(viewMode) ? application.getPublishedPages() : application.getPages();
    }

    private String getHomePageId(Application application, boolean viewMode) {
        String homePageId = null;
        List<ApplicationPage> applicationPages = getApplicationPages(application, viewMode);

        for (ApplicationPage applicationPage : applicationPages) {
            if (Boolean.TRUE.equals(applicationPage.getIsDefault())) {
                homePageId = applicationPage.getId();
                break;
            }
        }

        if (!StringUtils.hasLength(homePageId) && !CollectionUtils.isEmpty(applicationPages)) {
            log.error("application {} has no default page, returning first page as default", application.getId());
            homePageId = applicationPages.get(0).getId();
        }

        return homePageId;
    }

    /**
     *  Creates ApplicationPagesDTO
     * @param application : branched application
     * @param newPages : list of pages for the given mode
     * @param viewMode : is application in viewMode
     * @return : returns the getApplicationPagesDTO
     */
    public ApplicationPagesDTO getApplicationPagesDTO(
            Application application, List<NewPage> newPages, boolean viewMode) {

        String homePageId = getHomePageId(application, viewMode);
        List<PageNameIdDTO> pageNameIdDTOList = new ArrayList<>();
        List<ApplicationPage> applicationPages = application.getPages();
        List<ApplicationPage> publishedApplicationPages = application.getPublishedPages();

        Map<String, Integer> pagesOrder = new HashMap<>();
        Map<String, Integer> publishedPagesOrder = new HashMap<>();

        if (Boolean.TRUE.equals(viewMode)) {
            for (int i = 0; i < publishedApplicationPages.size(); i++) {
                publishedPagesOrder.put(publishedApplicationPages.get(i).getId(), i);
            }

        } else {
            for (int i = 0; i < applicationPages.size(); i++) {
                pagesOrder.put(applicationPages.get(i).getId(), i);
            }
        }

        for (NewPage pageFromDb : newPages) {
            PageNameIdDTO pageNameIdDTO = getPageNameIdDTO(pageFromDb, homePageId, viewMode);
            pageNameIdDTOList.add(pageNameIdDTO);
        }

        if (Boolean.TRUE.equals(viewMode)) {
            pageNameIdDTOList.sort(Comparator.comparing(item -> publishedPagesOrder.get(item.getId())));
        } else {
            pageNameIdDTOList.sort(Comparator.comparing(item -> pagesOrder.get(item.getId())));
        }

        application.setPages(null);
        application.setPublishedPages(null);
        application.setViewMode(viewMode);

        ApplicationPagesDTO applicationPagesDTO = new ApplicationPagesDTO();
        applicationPagesDTO.setWorkspaceId(application.getWorkspaceId());
        applicationPagesDTO.setPages(pageNameIdDTOList);
        applicationPagesDTO.setApplication(application);
        return applicationPagesDTO;
    }

    private static @NotNull PageNameIdDTO getPageNameIdDTO(NewPage pageFromDb, String homePageId, boolean viewMode) {
        PageNameIdDTO pageNameIdDTO = new PageNameIdDTO();
        pageNameIdDTO.setId(pageFromDb.getId());

        if (pageFromDb.getDefaultResources() == null) {
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "page", pageFromDb.getId());
        }

        pageNameIdDTO.setDefaultPageId(pageFromDb.getDefaultResources().getPageId());
        PageDTO pageDTO;

        if (Boolean.TRUE.equals(viewMode)) {
            if (pageFromDb.getPublishedPage() == null) {
                // We are trying to fetch published pages, however;
                // it doesn't exist because the page hasn't been published yet
                throw new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageFromDb.getId());
            }
            pageDTO = pageFromDb.getPublishedPage();
        } else {
            pageDTO = pageFromDb.getUnpublishedPage();
        }

        pageNameIdDTO.setName(pageDTO.getName());
        pageNameIdDTO.setIsHidden(pageDTO.getIsHidden());
        pageNameIdDTO.setSlug(pageDTO.getSlug());
        pageNameIdDTO.setIcon(pageDTO.getIcon());
        pageNameIdDTO.setCustomSlug(pageDTO.getCustomSlug());
        pageNameIdDTO.setUserPermissions(pageFromDb.getUserPermissions());
        pageNameIdDTO.setIsDefault(pageNameIdDTO.getId().equals(homePageId));
        return pageNameIdDTO;
    }

    public Mono<ApplicationPagesDTO> findApplicationPagesByApplicationIdViewModeAndBranch(
            String defaultApplicationId, String branchName, Boolean view, boolean markApplicationAsRecentlyAccessed) {
        AclPermission permission;
        if (view) {
            permission = applicationPermission.getReadPermission();
        } else {
            permission = applicationPermission.getEditPermission();
        }

        return applicationService
                .findBranchedApplicationId(branchName, defaultApplicationId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultApplicationId)))
                .flatMap(childApplicationId -> findApplicationPagesByApplicationIdViewMode(
                                childApplicationId, view, markApplicationAsRecentlyAccessed)
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, childApplicationId))))
                .map(responseUtils::updateApplicationPagesDTOWithDefaultResources);
    }

    @Override
    public Mono<PageDTO> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission permission, Boolean view) {
        return repository
                .findByNameAndApplicationIdAndViewMode(name, applicationId, permission, view)
                .flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Flux<NewPage> findNewPagesByApplicationId(String applicationId, AclPermission permission) {
        return repository.findByApplicationId(applicationId, permission);
    }

    @Override
    public Mono<List<NewPage>> archivePagesByApplicationId(String applicationId, AclPermission permission) {
        return findNewPagesByApplicationId(applicationId, permission)
                .flatMap(repository::archive)
                .collectList();
    }

    @Override
    // Remove if not used
    public Mono<List<String>> findAllPageIdsInApplication(
            String applicationId, AclPermission aclPermission, Boolean view) {
        return findNewPagesByApplicationId(applicationId, aclPermission)
                .flatMap(newPage -> {
                    // Look if the page is migrated
                    // Real time migration
                    if (Boolean.TRUE.equals(view)) {
                        if (newPage.getPublishedPage().getDeletedAt() != null) {
                            return Mono.just(newPage.getId());
                        }
                    } else {
                        if (newPage.getUnpublishedPage().getDeletedAt() != null) {
                            return Mono.just(newPage.getId());
                        }
                    }
                    // Looks like the page has been deleted in the `view` mode. Don't return the id for this page.
                    return Mono.empty();
                })
                .collectList();
    }

    @Override
    public Mono<PageDTO> updatePage(String pageId, PageDTO page) {
        return repository
                .findById(pageId, pagePermission.getEditPermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                .flatMap(dbPage -> {
                    copyNewFieldValuesIntoOldObject(page, dbPage.getUnpublishedPage());
                    if (!StringUtils.isEmpty(page.getName())) {
                        dbPage.getUnpublishedPage().setSlug(TextUtils.makeSlug(page.getName()));
                    }
                    return this.update(pageId, dbPage);
                })
                .flatMap(savedPage -> applicationService
                        .saveLastEditInformation(savedPage.getApplicationId())
                        .then(getPageByViewMode(savedPage, false)));
    }

    @Override
    public Mono<PageDTO> updatePageByDefaultPageIdAndBranch(
            String defaultPageId, PageUpdateDTO page, String branchName) {
        return repository
                .findPageByBranchNameAndDefaultPageId(branchName, defaultPageId, pagePermission.getEditPermission())
                .flatMap(newPage -> updatePage(newPage.getId(), page.toPageDTO()))
                .map(responseUtils::updatePageDTOWithDefaultResources);
    }

    @Override
    public Mono<NewPage> save(NewPage page) {
        // gitSyncId will be used to sync resource across instances
        if (page.getGitSyncId() == null) {
            page.setGitSyncId(page.getApplicationId() + "_" + UUID.randomUUID());
        }
        return repository.save(page);
    }

    @Override
    public Mono<NewPage> archive(NewPage page) {
        return repository.archive(page);
    }

    @Override
    public Mono<NewPage> archiveWithoutPermissionById(String id) {
        return archiveByIdEx(id, Optional.empty());
    }

    @Override
    public Mono<NewPage> archiveById(String id) {
        return archiveByIdEx(id, Optional.of(pagePermission.getDeletePermission()));
    }

    @Override
    public Mono<Boolean> archiveByIds(Collection<String> idList) {
        return repository.archiveAllById(idList);
    }

    public Mono<NewPage> archiveByIdEx(String id, Optional<AclPermission> permission) {
        Mono<NewPage> pageMono = this.findById(id, permission)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE_ID, id)))
                .cache();

        return pageMono.flatMap(newPage -> repository.archiveById(id)).then(pageMono);
    }

    @Override
    public Flux<NewPage> saveAll(List<NewPage> pages) {
        pages.stream()
                .filter(newPage -> newPage.getGitSyncId() == null)
                .forEach(newPage -> newPage.setGitSyncId(newPage.getId() + "_" + UUID.randomUUID()));
        return repository.saveAll(pages);
    }

    @Override
    public Mono<String> getNameByPageId(String pageId, boolean isPublishedName) {
        return repository.getNameByPageId(pageId, isPublishedName);
    }

    @Override
    public Mono<NewPage> findByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission) {

        if (!StringUtils.hasText(defaultPageId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        } else if (!StringUtils.hasText(branchName)) {
            return this.findById(defaultPageId, permission)
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, defaultPageId)));
        }
        return repository
                .findPageByBranchNameAndDefaultPageId(branchName, defaultPageId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, defaultPageId + ", " + branchName)));
    }

    @Override
    public Mono<String> findBranchedPageId(String branchName, String defaultPageId, AclPermission permission) {
        if (!StringUtils.hasText(branchName)) {
            if (!StringUtils.hasText(defaultPageId)) {
                return Mono.error(
                        new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID, defaultPageId));
            }
            return Mono.just(defaultPageId);
        }
        return repository
                .findPageByBranchNameAndDefaultPageId(branchName, defaultPageId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE_ID, defaultPageId + ", " + branchName)))
                .map(NewPage::getId);
    }

    @Override
    public Mono<String> findRootApplicationIdFromNewPage(String branchName, String defaultPageId) {
        Mono<NewPage> getPageMono;
        if (!StringUtils.hasLength(branchName)) {
            if (!StringUtils.hasLength(defaultPageId)) {
                return Mono.error(new AppsmithException(INVALID_PARAMETER, FieldName.PAGE_ID, defaultPageId));
            }
            getPageMono = repository
                    .queryBuilder()
                    .byId(defaultPageId)
                    .fields(FieldName.APPLICATION_ID, FieldName.DEFAULT_RESOURCES)
                    .permission(pagePermission.getReadPermission())
                    .one();
        } else {
            getPageMono = repository.findPageByBranchNameAndDefaultPageId(
                    branchName, defaultPageId, pagePermission.getReadPermission());
        }
        return getPageMono
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE_ID, defaultPageId + ", " + branchName)))
                .map(newPage -> {
                    log.debug("Retrieved possible application ids for page, picking the appropriate one now");
                    if (newPage.getDefaultResources() != null) {
                        return newPage.getDefaultResources().getApplicationId();
                    } else {
                        return newPage.getApplicationId();
                    }
                });
    }

    // Remove the code
    @Override
    public Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission);
    }

    @Override
    public Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        return repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission);
    }

    @Override
    public Flux<NewPage> findPageSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission) {
        return repository.findSlugsByApplicationIds(applicationIds, aclPermission);
    }

    /**
     * Returns a list of pages of an Application.
     * If Application ID is present, it'll fetch all pages of that application in the provided mode.
     * if Page ID is present, it'll fetch all pages of the corresponding Application.
     * If both IDs are present, it'll use the Application ID only and ignore the Page ID
     *
     * @param applicationId Id of the application
     * @param pageId        id of a page
     * @param branchName    name of the current branch
     * @param mode          In which mode it's in
     * @return List of ApplicationPagesDTO
     */
    @Override
    public Mono<ApplicationPagesDTO> findApplicationPages(
            String applicationId, String pageId, String branchName, ApplicationMode mode) {
        boolean isViewMode = (mode == ApplicationMode.PUBLISHED);
        if (StringUtils.hasLength(applicationId)) {
            return findApplicationPagesByApplicationIdViewModeAndBranch(applicationId, branchName, isViewMode, true);
        } else if (StringUtils.hasLength(pageId)) {
            return findRootApplicationIdFromNewPage(branchName, pageId)
                    .flatMap(rootApplicationId -> findApplicationPagesByApplicationIdViewModeAndBranch(
                            rootApplicationId, branchName, isViewMode, true));
        } else {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID + " or " + FieldName.PAGE_ID));
        }
    }

    @Override
    public Mono<Void> publishPages(Collection<String> pageIds, AclPermission permission) {
        return repository.publishPages(pageIds, permission);
    }
}
