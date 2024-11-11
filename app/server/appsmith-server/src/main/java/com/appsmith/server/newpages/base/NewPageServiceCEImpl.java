package com.appsmith.server.newpages.base;

import com.appsmith.external.enums.WorkspaceResourceContext;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.newpages.projections.PageDTOView;
import com.appsmith.server.newpages.projections.PageViewWithoutDSL;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.ce.PageSpanCE.FETCH_PAGE_FROM_DB;
import static com.appsmith.external.constants.spans.ce.PageSpanCE.GET_PAGE;
import static com.appsmith.external.constants.spans.ce.PageSpanCE.GET_PAGE_WITHOUT_BRANCH;
import static com.appsmith.external.constants.spans.ce.PageSpanCE.GET_PAGE_WITH_BRANCH;
import static com.appsmith.external.constants.spans.ce.PageSpanCE.MARK_RECENTLY_ACCESSED_RESOURCES_PAGES;
import static com.appsmith.external.constants.spans.ce.PageSpanCE.PREPARE_APPLICATION_PAGES_DTO_FROM_PAGES;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.exceptions.AppsmithError.INVALID_PARAMETER;
import static com.appsmith.server.helpers.ObservationUtils.getQualifiedSpanName;

@Slf4j
public class NewPageServiceCEImpl extends BaseService<NewPageRepository, NewPage, String> implements NewPageServiceCE {

    private final ApplicationService applicationService;
    private final UserDataService userDataService;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ObservationRegistry observationRegistry;

    @Autowired
    public NewPageServiceCEImpl(
            Validator validator,
            NewPageRepository repository,
            AnalyticsService analyticsService,
            ApplicationService applicationService,
            UserDataService userDataService,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ObservationRegistry observationRegistry) {
        super(validator, repository, analyticsService);
        this.applicationService = applicationService;
        this.userDataService = userDataService;
        this.applicationPermission = applicationPermission;
        this.pagePermission = pagePermission;
        this.observationRegistry = observationRegistry;
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
            page.setId(newPage.getId());
            page.setBaseId(newPage.getBaseIdOrFallback());
            page.setApplicationId(newPage.getApplicationId());
            page.setUserPermissions(newPage.getUserPermissions());
            page.setPolicies(newPage.getPolicies());
            return Mono.just(page);
        }

        // We shouldn't reach here.
        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
    }

    @Override
    public Mono<NewPage> findById(String pageId, AclPermission aclPermission) {
        return repository
                .findById(pageId, aclPermission)
                .name(FETCH_PAGE_FROM_DB)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Mono<PageDTO> findPageById(String pageId, AclPermission aclPermission, Boolean view) {
        return this.findById(pageId, aclPermission).flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Flux<PageDTO> findByApplicationId(String applicationId, AclPermission permission, Boolean view) {
        return findNewPagesByApplicationId(applicationId, permission).flatMap(page -> getPageByViewMode(page, view));
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
        newPage.setBaseId(object.getId());
        newPage.setBranchName(object.getBranchName());

        // Save page and update the defaultPageId after insertion
        return super.create(newPage)
                .flatMap(savedPage -> {
                    if (StringUtils.isEmpty(newPage.getBaseId())) {
                        NewPage updatePage = new NewPage();
                        updatePage.setBaseId(savedPage.getId());
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
    public Mono<ApplicationPagesDTO> findApplicationPagesByBranchedApplicationIdAndViewMode(
            String branchedApplicationId, Boolean view, boolean markApplicationAsRecentlyAccessed) {

        AclPermission permission = Boolean.TRUE.equals(view)
                ? applicationPermission.getReadPermission()
                : applicationPermission.getEditPermission();

        Mono<Application> applicationMono = applicationService
                .findById(branchedApplicationId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId)))
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
                    log.debug("Fetched application data for id: {}", branchedApplicationId);
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
                    List<PageViewWithoutDSL> pagesFromDb = tuple.getT1();
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

        ApplicationMode applicationMode = viewMode ? ApplicationMode.PUBLISHED : ApplicationMode.EDIT;
        Mono<ApplicationPagesDTO> getApplicationPagesDTOMono = Mono.just(
                        getApplicationPagesDTO(branchedApplication, newPages, viewMode))
                .name(getQualifiedSpanName(PREPARE_APPLICATION_PAGES_DTO_FROM_PAGES, applicationMode))
                .tap(Micrometer.observation(observationRegistry));
        if (Boolean.TRUE.equals(markRecentlyAccessed) && !viewMode) {
            Mono<UserData> markedRecentlyAccessedMono = userDataService
                    .updateLastUsedResourceAndWorkspaceList(
                            branchedApplication.getId(),
                            branchedApplication.getWorkspaceId(),
                            WorkspaceResourceContext.APPLICATIONS)
                    .name(getQualifiedSpanName(MARK_RECENTLY_ACCESSED_RESOURCES_PAGES, applicationMode))
                    .tap(Micrometer.observation(observationRegistry));

            return Mono.zip(markedRecentlyAccessedMono, getApplicationPagesDTOMono)
                    .map(Tuple2::getT2);
        }

        return getApplicationPagesDTOMono;
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
            Application application, List<PageViewWithoutDSL> newPages, boolean viewMode) {

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

        for (PageViewWithoutDSL pageFromDb : newPages) {
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

    private static PageNameIdDTO getPageNameIdDTO(PageViewWithoutDSL pageFromDb, String homePageId, boolean viewMode) {
        PageNameIdDTO pageNameIdDTO = new PageNameIdDTO();
        pageNameIdDTO.setId(pageFromDb.getId());
        pageNameIdDTO.setBaseId(pageFromDb.getBaseIdOrFallback());

        PageDTOView pageDTO;

        if (Boolean.TRUE.equals(viewMode)) {
            if (pageFromDb.getPublishedPage() == null) {
                // We are trying to fetch published pages, however;
                // it doesn't exist because the page hasn't been published yet
                throw new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageFromDb.id());
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
        // pageNameIdDTO.setUserPermissions(pageFromDb.getUserPermissions());
        pageNameIdDTO.setIsDefault(pageNameIdDTO.getId().equals(homePageId));
        return pageNameIdDTO;
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
    public <T> Flux<T> findNewPagesByApplicationId(String applicationId, AclPermission permission, Class<T> clazz) {
        return repository.findByApplicationId(applicationId, permission, clazz);
    }

    @Override
    public Mono<List<NewPage>> archivePagesByApplicationId(String applicationId, AclPermission permission) {
        return findNewPagesByApplicationId(applicationId, permission)
                .flatMap(repository::archive)
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
    public Mono<NewPage> archiveByIdWithoutPermission(String id) {
        return archiveByIdEx(id, null);
    }

    @Override
    public Mono<NewPage> archiveById(String id) {
        return archiveByIdEx(id, pagePermission.getDeletePermission());
    }

    @Override
    public Mono<Boolean> archiveByIds(Collection<String> idList) {
        return repository.archiveAllById(idList);
    }

    private Mono<NewPage> archiveByIdEx(String id, AclPermission permission) {
        Mono<NewPage> pageMono = findById(id, permission)
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
    public Mono<NewPage> findByBranchNameAndBasePageId(
            String branchName, String basePageId, AclPermission permission, List<String> projectedFieldNames) {

        if (!StringUtils.hasText(basePageId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        } else if (!StringUtils.hasText(branchName)) {
            return repository
                    .findById(basePageId, permission, projectedFieldNames)
                    .name(GET_PAGE_WITHOUT_BRANCH)
                    .tap(Micrometer.observation(observationRegistry))
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, basePageId)));
        }
        return repository
                .findPageByBranchNameAndBasePageId(branchName, basePageId, permission, projectedFieldNames)
                .name(GET_PAGE_WITH_BRANCH)
                .tap(Micrometer.observation(observationRegistry))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, basePageId + ", " + branchName)));
    }

    @Override
    public Mono<NewPage> findByBranchNameAndBasePageIdAndApplicationMode(
            String branchName, String basePageId, ApplicationMode mode) {

        AclPermission permission;
        if (ApplicationMode.EDIT.equals(mode)) {
            permission = pagePermission.getEditPermission();
        } else {
            permission = pagePermission.getReadPermission();
        }

        return this.findByBranchNameAndBasePageId(
                        branchName, basePageId, permission, List.of(NewPage.Fields.id, NewPage.Fields.applicationId))
                .name(getQualifiedSpanName(GET_PAGE, mode))
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Mono<String> findBranchedPageId(String branchName, String basePageId, AclPermission permission) {
        if (!StringUtils.hasText(branchName)) {
            if (!StringUtils.hasText(basePageId)) {
                return Mono.error(
                        new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID, basePageId));
            }
            return Mono.just(basePageId);
        }
        return repository
                .findPageByBranchNameAndBasePageId(branchName, basePageId, permission, null)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE_ID, basePageId + ", " + branchName)))
                .map(NewPage::getId);
    }

    Mono<String> findBranchedApplicationIdFromNewPageId(String branchedPageId) {
        Mono<NewPage> getPageMono;
        if (!StringUtils.hasLength(branchedPageId)) {
            return Mono.error(new AppsmithException(INVALID_PARAMETER, FieldName.PAGE_ID, branchedPageId));
        }
        getPageMono = repository
                .queryBuilder()
                .byId(branchedPageId)
                .fields(FieldName.APPLICATION_ID)
                .permission(pagePermission.getReadPermission())
                .one();

        return getPageMono
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE_ID, branchedPageId)))
                .map(NewPage::getApplicationId);
    }

    /**
     * Returns a list of pages of an Application.
     * If Application ID is present, it'll fetch all pages of that application in the provided mode.
     * if Page ID is present, it'll fetch all pages of the corresponding Application.
     * If both IDs are present, it'll use the Application ID only and ignore the Page ID
     *
     * @param branchedApplicationId Id of the application
     * @param branchedPageId        id of a page
     * @param mode                  In which mode it's in
     * @return List of ApplicationPagesDTO
     */
    @Override
    public Mono<ApplicationPagesDTO> findApplicationPages(
            String branchedApplicationId, String branchedPageId, ApplicationMode mode) {
        boolean isViewMode = (mode == ApplicationMode.PUBLISHED);
        if (StringUtils.hasLength(branchedApplicationId)) {
            return findApplicationPagesByBranchedApplicationIdAndViewMode(branchedApplicationId, isViewMode, true);
        } else if (StringUtils.hasLength(branchedPageId)) {
            return findBranchedApplicationIdFromNewPageId(branchedPageId)
                    .flatMap(rootApplicationId -> findApplicationPagesByBranchedApplicationIdAndViewMode(
                            rootApplicationId, isViewMode, true));
        } else {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID + " or " + FieldName.PAGE_ID));
        }
    }

    @Override
    public Mono<Void> publishPages(Collection<String> pageIds, AclPermission permission) {
        return repository.publishPages(pageIds, permission);
    }

    @Override
    public Flux<NewPage> findAllByApplicationIds(List<String> applicationIds, List<String> includedFields) {
        return repository.findAllByApplicationIds(applicationIds, includedFields);
    }

    @Override
    public Mono<String> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap, String branchName) {
        Mono<Integer> updateResult;
        if (branchName != null) {
            updateResult = findBranchedPageId(branchName, pageId, AclPermission.MANAGE_PAGES)
                    .flatMap(branchPageId -> repository.updateDependencyMap(branchPageId, dependencyMap));
        } else {
            updateResult = repository.updateDependencyMap(pageId, dependencyMap);
        }

        return updateResult.flatMap(count -> {
            if (count == 0) {
                return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, pageId));
            }
            return Mono.just(count.toString());
        });
    }

    @Override
    public Flux<PageDTO> findByApplicationIdAndApplicationMode(
            String applicationId, AclPermission permission, ApplicationMode applicationMode) {
        Boolean viewMode = ApplicationMode.PUBLISHED.equals(applicationMode);
        return findNewPagesByApplicationId(applicationId, permission)
                .filter(page -> {
                    PageDTO pageDTO;
                    if (ApplicationMode.PUBLISHED.equals(applicationMode)) {
                        pageDTO = page.getPublishedPage();
                    } else {
                        pageDTO = page.getUnpublishedPage();
                    }

                    boolean isDeletedOrNull = pageDTO == null || pageDTO.getDeletedAt() != null;
                    return !isDeletedOrNull;
                })
                .flatMap(page -> getPageByViewMode(page, viewMode));
    }
}
