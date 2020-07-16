package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
import com.appsmith.server.repositories.PageRepository;
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
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class PageServiceImpl extends BaseService<PageRepository, Page, String> implements PageService {

    private final ApplicationService applicationService;
    private final ActionRepository actionRepository;

    @Autowired
    public PageServiceImpl(Scheduler scheduler,
                           Validator validator,
                           MongoConverter mongoConverter,
                           ReactiveMongoTemplate reactiveMongoTemplate,
                           PageRepository repository,
                           ApplicationService applicationService,
                           AnalyticsService analyticsService,
                           ActionRepository actionRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationService = applicationService;
        this.actionRepository = actionRepository;
    }

    @Override
    public Mono<Page> findById(String pageId, AclPermission aclPermission) {
        return repository.findById(pageId, aclPermission);
    }

    @Override
    public Flux<Page> findByApplicationId(String applicationId) {
        return repository.findByApplicationId(applicationId, AclPermission.READ_PAGES);
    }

    @Override
    public Mono<Page> save(Page page) {
        return repository.save(page);
    }

    @Override
    public Mono<Page> create(Page page) {
        throw new UnsupportedOperationException("Please use `ApplicationPageService.createPage` to create a page.");
    }

    @Override
    public Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId, AclPermission aclPermission) {
        return repository.findByIdAndLayoutsId(pageId, layoutId, aclPermission);
    }

    @Override
    public Mono<Page> findByName(String name) {
        return repository.findByName(name, AclPermission.READ_PAGES);
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
            log.error("Unable to set the default page layout for id: {}", id);
        }
        return layout;
    }

    @Override
    public Mono<Void> deleteAll() {
        return repository.deleteAll();
    }

    /**
     * This function archives the page and all the actions associated with that page.
     *
     * @param id The pageId which needs to be archived.
     * @return
     */
    @Override
    public Mono<Page> delete(String id) {
        Mono<Page> pageMono = repository.findById(id, AclPermission.MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE_ID, id)))
                .flatMap(page -> {
                    log.debug("Going to archive pageId: {} for applicationId: {}", page.getId(), page.getApplicationId());
                    Mono<Application> applicationMono = applicationService.getById(page.getApplicationId())
                            .flatMap(application -> {
                                application.getPages().removeIf(p -> p.getId().equals(page.getId()));
                                return applicationService.save(application);
                            });
                    Mono<Page> archivedPageMono = repository.archive(page);
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
                .flatMap(deletedObj -> analyticsService.sendEvent(AnalyticsEvents.DELETE + "_" + deletedObj.getClass().getSimpleName().toUpperCase(), (Page) deletedObj));
    }

    @Override
    public Mono<ApplicationPagesDTO> findNamesByApplicationId(String applicationId) {
        Mono<Application> applicationMono = applicationService.findById(applicationId, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE + "by application id", applicationId)))
                .cache();

        Mono<List<PageNameIdDTO>> pagesListMono = applicationMono
                .flatMapMany(this::findNamesByApplication)
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
    public Mono<ApplicationPagesDTO> findNamesByApplicationName(String applicationName) {
        Mono<Application> applicationMono = applicationService.findByName(applicationName, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.NAME, applicationName)))
                .cache();

        Mono<List<PageNameIdDTO>> pagesListMono = applicationMono
                .flatMapMany(this::findNamesByApplication)
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

    private Flux<PageNameIdDTO> findNamesByApplication(Application application) {
        List<ApplicationPage> pages = application.getPages();
        return repository.findByApplicationId(application.getId(), AclPermission.READ_PAGES)
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
    public Mono<Page> findByNameAndApplicationId(String name, String applicationId, AclPermission permission) {
        return repository.findByNameAndApplicationId(name, applicationId, permission);
    }
}
