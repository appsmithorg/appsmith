package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.git.helpers.StringOutputStream;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.GitConstants;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
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
import com.appsmith.server.helpers.TextUtils;
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
import java.time.Instant;
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
                                  SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.policyUtils = policyUtils;
        this.configService = configService;
        this.commentThreadRepository = commentThreadRepository;
        this.sessionUserService = sessionUserService;
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
        if(!StringUtils.isEmpty(application.getName())) {
            application.setSlug(TextUtils.getSlug(application.getName()));
        }
        return repository.save(application)
                .flatMap(this::setTransientFields);
    }

    @Override
    public Mono<Application> create(Application object) {
        throw new UnsupportedOperationException("Please use `ApplicationPageService.createApplication` to create an application.");
    }

    @Override
    public Mono<Application> createDefault(Application application) {
        application.setSlug(TextUtils.getSlug(application.getName()));
        return super.create(application);
    }

    @Override
    public Mono<Application> update(String id, Application application) {
        application.setIsPublic(null);
        if(!StringUtils.isEmpty(application.getName())) {
            application.setSlug(TextUtils.getSlug(application.getName()));
        }
        return repository.updateById(id, application, AclPermission.MANAGE_APPLICATIONS)
            .onErrorResume(error -> {
                if (error instanceof DuplicateKeyException) {
                    // Error message : E11000 duplicate key error collection: appsmith.application index:
                    // organization_application_deleted_gitApplicationMetadata_compound_index dup key:
                    // { organizationId: "******", name: "AppName", deletedAt: null }
                    if (error.getCause().getMessage().contains("organization_application_deleted_gitApplicationMetadata_compound_index")) {
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

    public Mono<Application> setTransientFields(Application application) {
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

    /**
     * Generate SSH private and public keys required to communicate with remote. Keys will be stored only in the
     * default/root application only and not the child branched application. This decision is taken because the combined
     * size of keys is close to 4kB
     * @param applicationId application for which the SSH key needs to be generated
     * @return public key which will be used by user to copy to relevant platform
     */
    @Override
    public Mono<GitAuth> createOrUpdateSshKeyPair(String applicationId) {
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
        gitAuth.setPrivateKey(privateKeyOutput.toString());
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl(GitConstants.DEPLOY_KEY_DOC_URL);

        return repository.findById(applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                    new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application", applicationId)
                ))
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    // Check if the current application is the root application

                    if( gitData != null
                        && !StringUtils.isEmpty(gitData.getDefaultApplicationId())
                        && applicationId.equals(gitData.getDefaultApplicationId())) {
                        // This is the root application with update SSH key request
                        gitData.setGitAuth(gitAuth);
                        return save(application);
                    } else if(gitData == null) {
                        // This is a root application with generate SSH key request
                        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
                        gitApplicationMetadata.setDefaultApplicationId(applicationId);
                        gitApplicationMetadata.setGitAuth(gitAuth);
                        application.setGitApplicationMetadata(gitApplicationMetadata);
                        return save(application);
                    }
                    // Children application with update SSH key request for root application
                    // Fetch root application and then make updates. We are storing the git metadata only in root application
                    if (StringUtils.isEmpty(gitData.getDefaultApplicationId())) {
                        throw new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION,
                            "Unable to find root application, please connect your application to remote repo to resolve this issue.");
                    }
                    return repository.findById(gitData.getDefaultApplicationId(), MANAGE_APPLICATIONS)
                        .flatMap(defaultApplication -> {
                            GitApplicationMetadata gitApplicationMetadata = defaultApplication.getGitApplicationMetadata();
                            gitApplicationMetadata.setDefaultApplicationId(defaultApplication.getId());
                            gitApplicationMetadata.setGitAuth(gitAuth);
                            defaultApplication.setGitApplicationMetadata(gitApplicationMetadata);
                            return save(defaultApplication);
                        });
                })
                .thenReturn(gitAuth);
    }

    /**
     * Method to get the SSH public key
     * @param applicationId application for which the SSH key is requested
     * @return public SSH key
     */
    @Override
    public Mono<GitAuth> getSshKey(String applicationId) {
        return repository.findById(applicationId, MANAGE_APPLICATIONS)
            .switchIfEmpty(
                Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId))
            )
            .flatMap(application -> {
                GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                if (gitData == null) {
                    return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Can't find valid SSH key. Please configure the application with git"
                    ));
                }
                // Check if the application is root application
                if (applicationId.equals(gitData.getDefaultApplicationId())) {
                    gitData.getGitAuth().setDocUrl(GitConstants.DEPLOY_KEY_DOC_URL);
                    return Mono.just(gitData.getGitAuth());
                }
                if (gitData.getDefaultApplicationId() == null) {
                    throw new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION,
                        "Can't find root application. Please configure the application with git"
                    );
                }
                return repository.findById(gitData.getDefaultApplicationId(), MANAGE_APPLICATIONS)
                    .map(rootApplication -> {
                        GitAuth gitAuth = rootApplication.getGitApplicationMetadata().getGitAuth();
                        gitAuth.setDocUrl(GitConstants.DEPLOY_KEY_DOC_URL);
                        return gitAuth;
                    });
            });
    }

    @Override
    public Mono<Application> getApplicationByBranchNameAndDefaultApplication(String branchName,
                                                                             String defaultApplicationId,
                                                                             AclPermission aclPermission){
        if (StringUtils.isEmpty(branchName)) {
            return repository.findById(defaultApplicationId, aclPermission)
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultApplicationId))
                    );
        }
        return repository.getApplicationByGitBranchAndDefaultApplicationId(defaultApplicationId, branchName, aclPermission)
            .switchIfEmpty(Mono.error(
                new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.BRANCH_NAME, branchName))
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

    public Mono<String> getChildApplicationId(String branchName, String defaultApplicationId, AclPermission permission) {
        if (StringUtils.isEmpty(branchName)) {
            return Mono.just(defaultApplicationId);
        }
        return repository.getApplicationByGitBranchAndDefaultApplicationId(defaultApplicationId, branchName, permission)
            .switchIfEmpty(Mono.error(
                new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.BRANCH_NAME, branchName))
            )
            .map(Application::getId);
    }

    /**
     * As part of git sync feature a new application will be created for each branch with reference to main application
     * feat/new-branch ----> new application in Appsmith
     * Get all the applications which refer to the current application and archive those first one by one
     * GitApplicationMetadata has a field called defaultApplicationId which refers to the main application
     * @param defaultApplicationId Main Application from which the branch was created
     * @return Application flux which match the condition
     */
    @Override
    public Flux<Application> findAllApplicationsByGitDefaultApplicationId(String defaultApplicationId) {
        return repository.getApplicationByGitDefaultApplicationId(defaultApplicationId);
    }
}
