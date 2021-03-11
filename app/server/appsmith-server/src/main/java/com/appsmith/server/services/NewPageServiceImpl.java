package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.NewPageRepository;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.BeanCopyUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;

@Service
@Slf4j
public class NewPageServiceImpl extends BaseService<NewPageRepository, NewPage, String> implements NewPageService {

    private final ApplicationService applicationService;

    @Autowired
    public NewPageServiceImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              NewPageRepository repository,
                              AnalyticsService analyticsService,
                              ApplicationService applicationService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationService = applicationService;
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
                return Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, newPage.getId()));
            }
        } else {
            if (newPage.getUnpublishedPage() != null) {
                page = newPage.getUnpublishedPage();
                page.setName(newPage.getUnpublishedPage().getName());
            }
        }

        if (page != null) {
            page.setId(newPage.getId());
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
        return repository.findById(pageId, aclPermission);
    }

    @Override
    public Mono<PageDTO> findPageById(String pageId, AclPermission aclPermission, Boolean view) {
        return this.findById(pageId, aclPermission)
                .flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Flux<PageDTO> findByApplicationId(String applicationId, AclPermission permission, Boolean view) {
        return findNewPagesByApplicationId(applicationId, permission)
                .flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Mono<PageDTO> saveUnpublishedPage(PageDTO page) {

        return findById(page.getId(), AclPermission.MANAGE_PAGES)
                .flatMap(newPage -> {
                    newPage.setUnpublishedPage(page);
                    return repository.save(newPage);
                })
                .flatMap(savedPage -> getPageByViewMode(savedPage, false));
    }

    @Override
    public Mono<PageDTO> createDefault(PageDTO object) {
        NewPage newPage = new NewPage();
        newPage.setUnpublishedPage(object);

        newPage.setApplicationId(object.getApplicationId());
        newPage.setPolicies(object.getPolicies());
        return super.create(newPage)
                .flatMap(page -> getPageByViewMode(page, false));
    }

    @Override
    public Mono<PageDTO> findByIdAndLayoutsId(String pageId, String layoutId, AclPermission aclPermission, Boolean view) {
        return repository.findByIdAndLayoutsIdAndViewMode(pageId, layoutId, aclPermission, view)
                .flatMap(page -> getPageByViewMode(page, view));
    }

    @Override
    public Mono<PageDTO> findByNameAndViewMode(String name, AclPermission permission, Boolean view) {
        return repository.findByNameAndViewMode(name, permission, view)
                .flatMap(page -> getPageByViewMode(page, view));
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
    public Mono<ApplicationPagesDTO> findApplicationPagesByApplicationIdAndViewMode(String applicationId, Boolean view) {
        Mono<Application> applicationMono = applicationService.findById(applicationId, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                // Throw a 404 error if the application has never been published
                .flatMap(application -> {
                    if (Boolean.TRUE.equals(view)) {
                        if (application.getPublishedPages() == null || application.getPublishedPages().isEmpty()) {
                            // We are trying to fetch published pages but they don't exist because the application
                            // hasn't been published yet
                            return Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND,
                                    FieldName.PUBLISHED_APPLICATION, application.getId()));
                        }
                    }
                    return Mono.just(application);
                })
                .cache();

        Mono<String> defaultPageIdMono = applicationMono
                .map(application -> {
                    String defaultPageId = null;
                    List<ApplicationPage> applicationPages;
                    if (Boolean.TRUE.equals(view)) {
                        applicationPages = application.getPublishedPages();
                    } else {
                        applicationPages = application.getPages();
                    }

                    for (ApplicationPage applicationPage:applicationPages)
                    {
                        if (Boolean.TRUE.equals(applicationPage.getIsDefault())) {
                            defaultPageId = applicationPage.getId();
                        }
                    }
                    return defaultPageId;
                });

        Mono<List<PageNameIdDTO>> pagesListMono = applicationMono
                .map(application -> {
                    List<ApplicationPage> pages;
                    if (Boolean.TRUE.equals(view)) {
                        pages = application.getPublishedPages();
                    } else {
                        pages = application.getPages();
                    }
                    return pages.stream().map(page -> page.getId()).collect(Collectors.toList());
                })
                .flatMapMany(pageIds -> repository.findAllByIds(pageIds, READ_PAGES))
                .collectList()
                .zipWith(defaultPageIdMono)
                .flatMap(tuple -> {
                    List<NewPage> pagesFromDb = tuple.getT1();
                    String defaultPageId = tuple.getT2();

                    List<PageNameIdDTO> pageNameIdDTOList = new ArrayList<>();

                    for (NewPage pageFromDb : pagesFromDb) {

                        PageNameIdDTO pageNameIdDTO = new PageNameIdDTO();

                        pageNameIdDTO.setId(pageFromDb.getId());

                        if (Boolean.TRUE.equals(view)) {
                            if (pageFromDb.getPublishedPage() == null) {
                                // We are trying to fetch published page but it doesnt exist because the page hasn't been published yet
                                return Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND,
                                        FieldName.PAGE, pageFromDb.getId()));
                            }
                            pageNameIdDTO.setName(pageFromDb.getPublishedPage().getName());
                            pageNameIdDTO.setIsHidden(pageFromDb.getPublishedPage().getIsHidden());
                        } else {
                            pageNameIdDTO.setName(pageFromDb.getUnpublishedPage().getName());
                            pageNameIdDTO.setIsHidden(pageFromDb.getUnpublishedPage().getIsHidden());
                        }

                        if (pageNameIdDTO.getId().equals(defaultPageId)) {
                            pageNameIdDTO.setIsDefault(true);
                        } else {
                            pageNameIdDTO.setIsDefault(false);
                        }

                        pageNameIdDTOList.add(pageNameIdDTO);
                    }

                    return Mono.just(pageNameIdDTOList);
                });

        return Mono.zip(applicationMono, pagesListMono)
                .map(tuple -> {
                    Application application = tuple.getT1();
                    List<PageNameIdDTO> nameIdDTOList = tuple.getT2();
                    ApplicationPagesDTO applicationPagesDTO = new ApplicationPagesDTO();
                    applicationPagesDTO.setOrganizationId(application.getOrganizationId());
                    applicationPagesDTO.setPages(nameIdDTOList);
                    return applicationPagesDTO;
                });
    }

    @Override
    public Mono<ApplicationPagesDTO> findNamesByApplicationNameAndViewMode(String applicationName, Boolean view) {
        Mono<Application> applicationMono = applicationService.findByName(applicationName, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.NAME, applicationName)))
                .cache();

        Mono<List<PageNameIdDTO>> pagesListMono = applicationMono
                .flatMapMany(application -> findNamesByApplication(application, view))
                .collectList();

        return Mono.zip(applicationMono, pagesListMono)
                .map(tuple -> {
                    Application application = tuple.getT1();
                    List<PageNameIdDTO> nameIdDTOList = tuple.getT2();
                    ApplicationPagesDTO applicationPagesDTO = new ApplicationPagesDTO();
                    applicationPagesDTO.setOrganizationId(application.getOrganizationId());
                    applicationPagesDTO.setPages(nameIdDTOList);
                    return applicationPagesDTO;
                });
    }

    private Flux<PageNameIdDTO> findNamesByApplication(Application application, Boolean viewMode) {
        List<ApplicationPage> pages;

        if (Boolean.TRUE.equals(viewMode)) {
            pages = application.getPublishedPages();
        } else {
            pages = application.getPages();
        }

        return findByApplicationId(application.getId(), READ_PAGES, viewMode)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE + " by application id", application.getId())))
                .map(page -> {
                    PageNameIdDTO pageNameIdDTO = new PageNameIdDTO();
                    pageNameIdDTO.setId(page.getId());
                    pageNameIdDTO.setName(page.getName());
                    for (ApplicationPage applicationPage : pages) {
                        if (applicationPage.getId().equals(page.getId())) {
                            pageNameIdDTO.setIsDefault(applicationPage.getIsDefault());
                        }
                    }
                    return pageNameIdDTO;
                });
    }

    @Override
    public Mono<PageDTO> findByNameAndApplicationIdAndViewMode(String name, String applicationId, AclPermission permission, Boolean view) {
        return repository.findByNameAndApplicationIdAndViewMode(name, applicationId, permission, view)
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
    public Mono<List<String>> findAllPageIdsInApplication(String applicationId, AclPermission aclPermission, Boolean view) {
        return findNewPagesByApplicationId(applicationId, aclPermission)
                .flatMap(newPage -> {
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
    public Mono<PageDTO> updatePage(String id, PageDTO page) {
        NewPage newPage = new NewPage();
        newPage.setUnpublishedPage(page);

        return repository.findById(id, AclPermission.MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, id)))
                .flatMap(dbPage -> {
                    copyNewFieldValuesIntoOldObject(page, dbPage.getUnpublishedPage());
                    return this.update(id, dbPage);
                })
                .flatMap(savedPage -> getPageByViewMode(savedPage, false));
    }

    @Override
    public Mono<NewPage> save(NewPage page) {
        return repository.save(page);
    }

    @Override
    public Mono<NewPage> archive(NewPage page) {
        return repository.archive(page);
    }

    @Override
    public Mono<Boolean> archiveById(String id) {
        return repository.archiveById(id);
    }

    @Override
    public Flux<NewPage> saveAll(List<NewPage> pages) {
        return repository.saveAll(pages);
    }

    @Override
    public Mono<String> getNameByPageId(String pageId, boolean isPublishedName) {
        return repository.getNameByPageId(pageId, isPublishedName);
    }
}
