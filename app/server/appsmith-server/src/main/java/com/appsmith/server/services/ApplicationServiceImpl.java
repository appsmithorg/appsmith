package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
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
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;


@Slf4j
@Service
public class ApplicationServiceImpl extends BaseService<ApplicationRepository, Application, String> implements ApplicationService {

    private final PolicyUtils policyUtils;
    private final ConfigService configService;

    @Autowired
    public ApplicationServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApplicationRepository repository,
                                  AnalyticsService analyticsService,
                                  PolicyUtils policyUtils,
                                  ConfigService configService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.policyUtils = policyUtils;
        this.configService = configService;
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, id)));
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
    public Mono<Application> update(String id, Application application) {
        application.setIsPublic(null);
        //Check here if we have application with same attributes like name to give more contextual duplicate key error
        return isNameAllowed(id, application)
            .flatMap(nameAllowed -> {
                // If the name is allowed, return update resource for further processing
                if (Boolean.TRUE.equals(nameAllowed)) {
                    return repository.updateById(id, application, AclPermission.MANAGE_APPLICATIONS)
                        .flatMap(analyticsService::sendUpdateEvent);
                }
                // Throw an error since the new action's name matches an existing action or widget name.
                return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR, application.getName(), FieldName.NAME));
            });
    }

    @Override
    public Mono<Application> archive(Application application) {
        return repository.archive(application);
    }

    @Override
    public Mono<Application> changeViewAccess(String id, ApplicationAccessDTO applicationAccessDTO) {
        return repository
                .findById(id, MAKE_PUBLIC_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, id)))
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
        return configService.getTemplateApplications()
                .map(application -> application.getId())
                .defaultIfEmpty("")
                .collectList()
                .cache()
                .repeat()
                .zipWith(applicationsFlux)
                .map(tuple -> {
                    List<String> templateApplicationIds = tuple.getT1();
                    Application application = tuple.getT2();

                    application.setAppIsExample(templateApplicationIds.contains(application.getId()));
                    return application;
                });
    }

    private Mono<Boolean> isNameAllowed(String applicationId, Application applicationContext) {

        Mono<Application> savedApplicationMono = repository.findById(applicationId, MANAGE_APPLICATIONS)
            .switchIfEmpty(Mono.error(
                new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId))
            );

        return savedApplicationMono
            .flatMap(savedApplication -> {
                String applicationName = applicationContext.getName() != null
                    ? applicationContext.getName() : savedApplication.getName();
                savedApplication.setName(applicationName);

                return repository.findByOrganizationId(savedApplication.getOrganizationId())
                    .filter(application -> StringUtils.equals(application.getName(), savedApplication.getName())
                        && !StringUtils.equals(application.getId(), savedApplication.getId())
                    )
                    // Need single match here
                    .next();
            })
            .map(application1 -> false)
            .switchIfEmpty(Mono.just(true));
    }

}
