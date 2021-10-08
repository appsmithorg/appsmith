package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.git.helpers.StringOutputStream;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitAuth;
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
import com.appsmith.server.repositories.CommentThreadRepository;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.KeyPair;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
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
    private final CommentThreadRepository commentThreadRepository;
    private final SessionUserService sessionUserService;
    private final EncryptionService encryptionService;

    @Autowired
    public ApplicationServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApplicationRepository repository,
                                  AnalyticsService analyticsService,
                                  PolicyUtils policyUtils,
                                  ConfigService configService,
                                  CommentThreadRepository commentThreadRepository,
                                  SessionUserService sessionUserService,
                                  EncryptionService encryptionService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.policyUtils = policyUtils;
        this.configService = configService;
        this.commentThreadRepository = commentThreadRepository;
        this.sessionUserService = sessionUserService;
        this.encryptionService = encryptionService;
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, id)))
                .zipWith(sessionUserService.getCurrentUser())
                .flatMap(objects -> {
                    Application application = objects.getT1();
                    User user = objects.getT2();
                    return setUnreadCommentCount(application, user);
                });
    }

    private Mono<Application> setUnreadCommentCount(Application application, User user) {
        if(!user.isAnonymous()) {
            return commentThreadRepository.countUnreadThreads(application.getId(), user.getUsername())
                    .map(aLong -> {
                        application.setUnreadCommentThreads(aLong);
                        return application;
                    });
        } else {
            return Mono.just(application);
        }
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
        return repository.updateById(id, application, AclPermission.MANAGE_APPLICATIONS)
            .onErrorResume(error -> {
                if (error instanceof DuplicateKeyException) {
                    // Error message : E11000 duplicate key error collection: appsmith.application index:
                    // organization_application_deleted_gitRepo_gitBranch_compound_index dup key:
                    // { organizationId: "******", name: "AppName", deletedAt: null }
                    if (error.getCause().getMessage().contains("organization_application_deleted_gitRepo_gitBranch_compound_index")) {
                        return Mono.error(
                            new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR, FieldName.APPLICATION, FieldName.NAME)
                        );
                    }
                    return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY, error.getCause().getMessage()));
                }
                return Mono.error(error);
            })
            .flatMap(analyticsService::sendUpdateEvent);
    }

    @Override
    public Mono<Application> archive(Application application) {
        return repository.archive(application);
    }

    @Override
    public Mono<Application> changeViewAccess(String id, ApplicationAccessDTO applicationAccessDTO) {
        Mono<Application> updateApplicationMono = repository
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

        //  Use a synchronous sink which does not take subscription cancellations into account. This that even if the
        //  subscriber has cancelled its subscription, the create method will still generates its event.
        return Mono.create(sink -> updateApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
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
                })
                .zipWith(sessionUserService.getCurrentUser())
                .flatMap(objects -> {
                    Application application = objects.getT1();
                    User user = objects.getT2();
                    return setUnreadCommentCount(application, user);
                });
    }

    private Mono<? extends Application> generateAndSetPoliciesForPublicView(Application application, Boolean isPublic) {

        User user = new User();
        user.setName(FieldName.ANONYMOUS_USER);
        user.setEmail(FieldName.ANONYMOUS_USER);
        user.setIsAnonymous(true);

        Map<String, Policy> applicationPolicyMap = policyUtils.generatePolicyFromPermission(Set.of(READ_APPLICATIONS), user);
        Map<String, Policy> pagePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> actionPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils.generatePolicyFromPermission(Set.of(EXECUTE_DATASOURCES), user);

        final Flux<NewPage> updatedPagesFlux = policyUtils
                .updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, isPublic);
        // Use the same policy map as actions for action collections since action collections have the same kind of permissions
        final Flux<ActionCollection> updatedActionCollectionsFlux = policyUtils
                .updateWithPagePermissionsToAllItsActionCollections(application.getId(), actionPolicyMap, isPublic);

        final Flux<NewAction> updatedActionsFlux = updatedPagesFlux
                .collectList()
                .thenMany(updatedActionCollectionsFlux)
                .collectList()
                .then(Mono.justOrEmpty(application.getId()))
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

    @Override
    public Mono<String> generateSshKeyPair(String applicationId) {
        JSch jsch = new JSch();
        KeyPair kpair;
        try {
            kpair = KeyPair.genKeyPair(jsch, KeyPair.RSA, 2048);
        } catch (JSchException e) {
            log.error("failed to generate RSA key pair", e);
            throw new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, "Failed to generate SSH Keypair");
        }

        StringOutputStream privateKeyOutput = new StringOutputStream();
        StringOutputStream publicKeyOutput = new StringOutputStream();

        kpair.writePrivateKey(privateKeyOutput);
        kpair.writePublicKey(publicKeyOutput, "appsmith");

        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey(publicKeyOutput.toString());
        gitAuth.setPrivateKey(encryptionService.encryptString(privateKeyOutput.toString()));

        return repository.findById(applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application", applicationId)
                ))
                .map(application -> {
                    String targetApplicationId = application.getId(); // by default, we'll update the provided app
                    if(application.getGitApplicationMetadata() != null
                            && !StringUtils.isEmpty(application.getGitApplicationMetadata().getDefaultApplicationId())) {
                        // this is a child application, update the master application
                        targetApplicationId = application.getGitApplicationMetadata().getDefaultApplicationId();
                    }
                    return targetApplicationId;
                })
                .flatMap(targetApplicationId -> repository
                        .setGitAuth(targetApplicationId, gitAuth, MANAGE_APPLICATIONS)
                        .thenReturn(gitAuth.getPublicKey())
                );
    }
    /**
     * Sets the updatedAt and modifiedBy fields of the Application
     * @param applicationId Application ID
     * @return Application Mono of updated Application
     */
    @Override
    public Mono<Application> saveLastEditInformation(String applicationId) {
        Application application = new Application();
        /*
          We're not setting updatedAt and modifiedBy fields to the application DTO because these fields will be set
          by the updateById method of the BaseAppsmithRepositoryImpl
         */
        return repository.updateById(applicationId, application, MANAGE_APPLICATIONS); // it'll do a set operation
    }
}
