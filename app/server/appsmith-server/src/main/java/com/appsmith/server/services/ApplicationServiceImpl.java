package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;


@Slf4j
@Service
public class ApplicationServiceImpl extends BaseService<ApplicationRepository, Application, String> implements ApplicationService {

    //Using PageRepository instead of PageService is because a cyclic dependency is introduced if PageService is used here.
    //TODO : Solve for this across LayoutService, PageService and ApplicationService.
    private final NewPageRepository newPageRepository;
    private final PolicyUtils policyUtils;
    private final ConfigService configService;
    private final NewActionService newActionService;

    @Autowired
    public ApplicationServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApplicationRepository repository,
                                  AnalyticsService analyticsService,
                                  PolicyUtils policyUtils,
                                  ConfigService configService,
                                  NewPageRepository newPageRepository,
                                  NewActionService newActionService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.policyUtils = policyUtils;
        this.configService = configService;
        this.newPageRepository = newPageRepository;
        this.newActionService = newActionService;
    }

    @Override
    public Flux<Application> get(MultiValueMap<String, String> params) {
        return setTransientFields(super.getWithPermission(params, READ_APPLICATIONS));
    }

    @Override
    public Mono<Application> getById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository.findById(id, READ_APPLICATIONS)
                .flatMap(this::setTransientFields)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }

    @Override
    public Mono<Application> findById(String id) {
        return repository.findById(id)
                .flatMap(this::setTransientFields);
    }

    @Override
    public Mono<Application> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission)
                .flatMap(this::setTransientFields);
    }

    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String organizationId, AclPermission permission) {
        return repository.findByIdAndOrganizationId(id, organizationId, permission)
                .flatMap(this::setTransientFields);
    }

    @Override
    public Flux<Application> findByOrganizationId(String organizationId, AclPermission permission) {
        return setTransientFields(repository.findByOrganizationId(organizationId, permission));
    }

    @Override
    public Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission) {
        return repository.findByClonedFromApplicationId(applicationId, permission);
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        return repository.findByName(name, permission)
                .flatMap(this::setTransientFields);
    }

    @Override
    public Mono<Application> save(Application application) {
        return repository.save(application)
                .flatMap(this::setTransientFields);
    }

    @Override
    public Mono<Application> create(Application object) {
        throw new UnsupportedOperationException("Please use `ApplicationPageService.createApplication` to create an application.");
    }

    @Override
    public Mono<Application> createDefault(Application object) {
        return super.create(object);
    }

    @Override
    public Mono<Application> update(String id, Application resource) {
        return repository.updateById(id, resource, AclPermission.MANAGE_APPLICATIONS)
                .flatMap(analyticsService::sendUpdateEvent);
    }

    @Override
    public Mono<Application> archive(Application application) {
        return repository.archive(application);
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
        Mono<Application> applicationMono = findById(applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application", applicationId)));

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
                                .flatMap(id -> newPageRepository.archiveById(id))
                                .collectList();
                    } else {
                        archivePageListMono = Mono.just(new ArrayList<>());
                    }

                    application.setPublishedPages(pages);

                    // Archive the deleted pages and save the application changes and then return the pages so that
                    // the pages can also be published
                    return Mono.zip(archivePageListMono, repository.save(application))
                            .thenReturn(pages);
                })
                .flatMapMany(Flux::fromIterable)
                //In each page, copy each layout's dsl to publishedDsl field
                .flatMap(applicationPage -> newPageRepository
                        .findById(applicationPage.getId())
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page", applicationPage.getId())))
                        .map(page -> {
                            page.setPublishedPage(page.getUnpublishedPage());
                            return page;
                        }))
                .collectList()
                .flatMapMany(newPageRepository::saveAll);

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

    @Override
    public Mono<Application> changeViewAccess(String id, ApplicationAccessDTO applicationAccessDTO) {
        return repository
                .findById(id, MAKE_PUBLIC_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, id)))
                .flatMap(application -> {

                    if (application.getIsPublic().equals(applicationAccessDTO.getPublicAccess())) {
                        // No change. The required public access is the same as current public access. Do nothing
                        return Mono.just(application);
                    }

                    if (application.getIsPublic() == null && applicationAccessDTO.getPublicAccess().equals(false)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }

                    application.setIsPublic(applicationAccessDTO.getPublicAccess());
                    return generateAndSetPoliciesForPublicView(application, applicationAccessDTO.getPublicAccess());
                });
    }

    @Override
    public Flux<Application> findAllApplicationsByOrganizationId(String organizationId) {
        return repository.findByOrganizationId(organizationId);
    }

    @Override
    public Mono<Application> getApplicationInViewMode(String applicationId) {
        return repository.findById(applicationId, READ_APPLICATIONS)
                .map(application -> {
                    application.setViewMode(true);
                    return application;
                });
    }

    private Mono<? extends Application> generateAndSetPoliciesForPublicView(Application application, Boolean isPublic) {
        AclPermission applicationPermission = READ_APPLICATIONS;
        AclPermission datasourcePermission = EXECUTE_DATASOURCES;

        User user = new User();
        user.setName(FieldName.ANONYMOUS_USER);
        user.setEmail(FieldName.ANONYMOUS_USER);
        user.setIsAnonymous(true);

        Map<String, Policy> applicationPolicyMap = policyUtils.generatePolicyFromPermission(Set.of(applicationPermission), user);
        Map<String, Policy> pagePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> actionPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils.generatePolicyFromPermission(Set.of(datasourcePermission), user);

        Flux<NewPage> updatedPagesFlux = policyUtils.updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, isPublic);

        Flux<NewAction> updatedActionsFlux = updatedPagesFlux
                .collectList()
                .then(Mono.just(application.getId()))
                .flatMapMany(applicationId -> policyUtils.updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, isPublic));

        return updatedActionsFlux
                .collectList()
                .flatMap(actions -> {
                    Set<String> datasourceIds = new HashSet<>();
                    for (NewAction action : actions) {
                        ActionDTO unpublishedAction = action.getUnpublishedAction();
                        ActionDTO publishedAction = action.getPublishedAction();

                        if (unpublishedAction.getDatasource() != null &&
                                unpublishedAction.getDatasource().getId() != null) {
                            datasourceIds.add(unpublishedAction.getDatasource().getId());
                        }

                        if (publishedAction != null &&
                                publishedAction.getDatasource() != null &&
                                publishedAction.getDatasource().getId() != null) {
                            datasourceIds.add(publishedAction.getDatasource().getId());
                        }
                    }

                    return policyUtils.updateWithNewPoliciesToDatasourcesByDatasourceIds(datasourceIds, datasourcePolicyMap, isPublic)
                            .collectList();
                })
                .thenReturn(application)
                .flatMap(app -> {
                    Application updatedApplication;

                    if (isPublic) {
                        updatedApplication = policyUtils.addPoliciesToExistingObject(applicationPolicyMap, application);
                    } else {
                        updatedApplication = policyUtils.removePoliciesFromExistingObject(applicationPolicyMap, application);
                    }

                    return repository.save(updatedApplication);
                });

    }

    private Mono<Application> setTransientFields(Application application) {
        return setTransientFields(Flux.just(application)).last();
    }

    private Flux<Application> setTransientFields(Flux<Application> applicationsFlux) {
        return configService.getTemplateOrganizationId()
                .defaultIfEmpty("")
                .cache()
                .repeat()
                .zipWith(applicationsFlux, (templateOrganizationId, application) -> {
                    application.setAppIsExample(templateOrganizationId.equals(application.getOrganizationId()));
                    return application;
                });
    }
}
