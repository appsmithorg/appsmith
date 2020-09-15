package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
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
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class NewPageServiceImpl extends BaseService<NewPageRepository, NewPage, String> implements NewPageService {

    private final ApplicationService applicationService;
    private final ActionRepository actionRepository;

    @Autowired
    public NewPageServiceImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              NewPageRepository repository,
                              AnalyticsService analyticsService,
                              ApplicationService applicationService,
                              ActionRepository actionRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationService = applicationService;
        this.actionRepository = actionRepository;
    }

    private Page getPageByViewMode(NewPage newPage, Boolean viewMode) {
        Page page = new Page();
        page.setApplicationId(newPage.getApplicationId());
        page.setUserPermissions(newPage.getUserPermissions());
        page.setId(newPage.getId());
        if (Boolean.TRUE.equals(viewMode)) {
            page.setLayouts(newPage.getPublishedPage().getLayouts());
            page.setName(newPage.getPublishedPage().getName());
        } else {
            page.setLayouts(newPage.getUnpublishedPage().getLayouts());
            page.setName(newPage.getUnpublishedPage().getName());
        }

        return page;
    }

    @Override
    public Mono<Page> findById(String pageId, AclPermission aclPermission, Boolean view) {
        return repository.findById(pageId, aclPermission)
                .map(page -> getPageByViewMode(page, view));
    }

    @Override
    public Flux<Page> findByApplicationId(String applicationId, AclPermission permission, Boolean view) {
        return repository.findByApplicationId(applicationId, permission)
                .map(page -> getPageByViewMode(page, view));
    }

    @Override
    public Mono<Page> createDefault(Page object) {
        NewPage newPage = new NewPage();
        newPage.setApplicationId(object.getApplicationId());
        PageDTO unpublishedPageDto = new PageDTO();
        unpublishedPageDto.setLayouts(object.getLayouts());
        unpublishedPageDto.setName(object.getName());
        newPage.setUnpublishedPage(unpublishedPageDto);
        return super.create(newPage)
                .map(page -> getPageByViewMode(page, false));
    }

    @Override
    public Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId, AclPermission aclPermission, Boolean view) {
        return repository.findByIdAndLayoutsIdAndViewMode(pageId, layoutId, aclPermission, view)
                .map(page -> getPageByViewMode(page, view));
    }

    @Override
    public Mono<Page> findByNameAndViewMode(String name, AclPermission permission, Boolean view) {
        return repository.findByNameAndViewMode(name, permission, view)
                .map(page -> getPageByViewMode(page, view));
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

    /**
     * This function archives the unpublished page.
     *
     * TODO : Archive the unpublished actions as well using the following code fragment :
     * Mono<List<Action>> archivedActionsMono = actionRepository.findByPageId(page.getId(), AclPermission.MANAGE_ACTIONS)
     *                             .flatMap(action -> {
     *                                 log.debug("Going to archive actionId: {} for applicationId: {}", action.getId(), id);
     *                                 return actionRepository.archive(action);
     *                             }).collectList();
     *
     * TODO : During publish, if a page is deleted in published mode as well, archive the page completely (instead of just
     * published mode) and then archive all the actions associated with this page.
     *
     * @param id The pageId which needs to be archived.
     * @return
     */
    @Override
    public Mono<Page> deleteUnpublishedPage(String id) {
        Mono<Page> pageMono = repository.findById(id, AclPermission.MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE_ID, id)))
                .flatMap(page -> {
                    log.debug("Going to archive pageId: {} for applicationId: {}", page.getId(), page.getApplicationId());
                    Mono<Application> applicationMono = applicationService.getById(page.getApplicationId())
                            .flatMap(application -> {
                                application.getPages().removeIf(p -> p.getId().equals(page.getId()));
                                return applicationService.save(application);
                            });
                    PageDTO unpublishedPage = page.getUnpublishedPage();
                    unpublishedPage.setDeletedAt(Instant.now());
                    Mono<Page> archivedPageMono = repository.save(page)
                            .map(newPage -> getPageByViewMode(newPage, false));

                    /**
                     * TODO : Only delete unpublished action and not the entire action.
                     */
                    Mono<List<Action>> archivedActionsMono = actionRepository.findByPageId(page.getId(), AclPermission.MANAGE_ACTIONS)
                                                         .flatMap(action -> {
                                      log.debug("Going to archive actionId: {} for applicationId: {}", action.getId(), id);
                                      return actionRepository.archive(action);
                                 }).collectList();

                    return Mono.zip(archivedPageMono, archivedActionsMono, applicationMono)
                            .map(tuple -> {
                                Page page1 = tuple.getT1();
                                List<Action> actions = tuple.getT2();
                                Application application = tuple.getT3();
                                log.debug("Archived pageId: {} and {} actions for applicationId: {}", page1.getId(), actions.size(), application.getId());
                                return page1;
                            });
                });

        return pageMono
                .flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<ApplicationPagesDTO> findNamesByApplicationIdAndViewMode(String applicationId, Boolean view) {
        Mono<Application> applicationMono = applicationService.findById(applicationId, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE + "by application id", applicationId)))
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
        List<ApplicationPage> pages = application.getPages();
        return findByApplicationId(application.getId(), AclPermission.READ_PAGES, viewMode)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE + "by application name", application.getName())))
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
    public Mono<Page> findByNameAndApplicationIdAndViewMode(String name, String applicationId, AclPermission permission, Boolean view) {
        return repository.findByNameAndApplicationIdAndViewMode(name, applicationId, permission, view)
                .map(page -> getPageByViewMode(page, view));
    }
}
