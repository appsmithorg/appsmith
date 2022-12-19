package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.GitAuthDTO;
import com.appsmith.server.dtos.GitDeployKeyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.mongodb.DBObject;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
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

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
public class ApplicationServiceCEImpl extends BaseService<ApplicationRepository, Application, String> implements ApplicationServiceCE {

    private final PolicyUtils policyUtils;
    private final ConfigService configService;
    private final CommentThreadRepository commentThreadRepository;
    private final SessionUserService sessionUserService;
    private final ResponseUtils responseUtils;

    private final PermissionGroupService permissionGroupService;

    private final TenantService tenantService;

    private final UserRepository userRepository;
    private final DatasourcePermission datasourcePermission;
    private final ApplicationPermission applicationPermission;

    @Autowired
    public ApplicationServiceCEImpl(Scheduler scheduler,
                                    Validator validator,
                                    MongoConverter mongoConverter,
                                    ReactiveMongoTemplate reactiveMongoTemplate,
                                    ApplicationRepository repository,
                                    AnalyticsService analyticsService,
                                    PolicyUtils policyUtils,
                                    ConfigService configService,
                                    CommentThreadRepository commentThreadRepository,
                                    SessionUserService sessionUserService,
                                    ResponseUtils responseUtils,
                                    PermissionGroupService permissionGroupService,
                                    TenantService tenantService,
                                    UserRepository userRepository,
                                    DatasourcePermission datasourcePermission,
                                    ApplicationPermission applicationPermission) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.policyUtils = policyUtils;
        this.configService = configService;
        this.commentThreadRepository = commentThreadRepository;
        this.sessionUserService = sessionUserService;
        this.responseUtils = responseUtils;
        this.permissionGroupService = permissionGroupService;
        this.tenantService = tenantService;
        this.userRepository = userRepository;
        this.datasourcePermission = datasourcePermission;
        this.applicationPermission = applicationPermission;
    }

    @Override
    public Flux<Application> get(MultiValueMap<String, String> params) {
        if (!StringUtils.isEmpty(params.getFirst(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME))) {
            params.add("gitApplicationMetadata.branchName", params.getFirst(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME));
            params.remove(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME);
        }
        return setTransientFields(super.getWithPermission(params, applicationPermission.getReadPermission()))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    @Override
    public Mono<Application> getById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository.findById(id, applicationPermission.getReadPermission())
                .flatMap(this::setTransientFields)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, id)))
                .zipWith(sessionUserService.getCurrentUser())
                .flatMap(objects -> {
                    Application application = objects.getT1();
                    User user = objects.getT2();
                    return setUnreadCommentCount(application, user);
                });
    }

    @Override
    public Mono<Application> findByIdAndBranchName(String id, String branchName) {
        return findByIdAndBranchName(id, null, branchName);
    }

    @Override
    public Mono<Application> findByIdAndBranchName(String id, List<String> projectionFieldNames, String branchName) {
        return this.findByBranchNameAndDefaultApplicationId(branchName, id, projectionFieldNames,
                        applicationPermission.getReadPermission())
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    private Mono<Application> setUnreadCommentCount(Application application, User user) {
        if (!user.isAnonymous()) {
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
    public Mono<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission) {
        return repository.findByIdAndWorkspaceId(id, workspaceId, permission)
                .flatMap(this::setTransientFields);
    }

    @Override
    public Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        return setTransientFields(repository.findByWorkspaceId(workspaceId, permission));
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
        if (!StringUtils.isEmpty(application.getName())) {
            application.setSlug(TextUtils.makeSlug(application.getName()));
        }

        if (application.getApplicationVersion() != null) {
            int appVersion = application.getApplicationVersion();
            if (appVersion < ApplicationVersion.EARLIEST_VERSION || appVersion > ApplicationVersion.LATEST_VERSION) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER,
                        QApplication.application.applicationVersion.getMetadata().getName()
                ));
            }
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
        application.setSlug(TextUtils.makeSlug(application.getName()));
        application.setLastEditedAt(Instant.now());
        if (!StringUtils.hasLength(application.getColor())) {
            application.setColor(getRandomAppCardColor());
        }
        return super.create(application);
    }

    @Override
    public Mono<Application> update(String id, Application application) {
        application.setIsPublic(null);
        application.setLastEditedAt(Instant.now());
        if (!StringUtils.isEmpty(application.getName())) {
            application.setSlug(TextUtils.makeSlug(application.getName()));
        }

        if (application.getApplicationVersion() != null) {
            int appVersion = application.getApplicationVersion();
            if (appVersion < ApplicationVersion.EARLIEST_VERSION || appVersion > ApplicationVersion.LATEST_VERSION) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER,
                        QApplication.application.applicationVersion.getMetadata().getName()
                ));
            }
        }

        Mono<String> applicationIdMono;
        GitApplicationMetadata gitData = application.getGitApplicationMetadata();
        if (gitData != null && !StringUtils.isEmpty(gitData.getBranchName()) && !StringUtils.isEmpty(gitData.getDefaultApplicationId())) {
            applicationIdMono = this.findByBranchNameAndDefaultApplicationId(gitData.getBranchName(), gitData.getDefaultApplicationId(), applicationPermission.getEditPermission())
                    .map(Application::getId);
        } else {
            applicationIdMono = Mono.just(id);
        }
        return applicationIdMono
                .flatMap(appId -> repository.updateById(appId, application, applicationPermission.getEditPermission())
                        .onErrorResume(error -> {
                            if (error instanceof DuplicateKeyException) {
                                // Error message : E11000 duplicate key error collection: appsmith.application index:
                                // workspace_application_deleted_gitApplicationMetadata_compound_index dup key:
                                // { organizationId: "******", name: "AppName", deletedAt: null }
                                if (error.getCause().getMessage().contains("workspace_application_deleted_gitApplicationMetadata_compound_index")) {
                                    return Mono.error(
                                            new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR, FieldName.APPLICATION, FieldName.NAME)
                                    );
                                }
                                return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY, error.getCause().getMessage()));
                            }
                            return Mono.error(error);
                        })
                        .flatMap(application1 -> {
                            final Map<String, Object> eventData = Map.of(
                                    FieldName.APP_MODE, ApplicationMode.EDIT.toString(),
                                    FieldName.APPLICATION, application1
                            );
                            final Map<String, Object> data = Map.of(
                                    FieldName.APPLICATION_ID, application1.getId(),
                                    FieldName.WORKSPACE_ID, application1.getWorkspaceId(),
                                    FieldName.EVENT_DATA, eventData
                            );
                            return analyticsService.sendUpdateEvent(application1, data);
                        }));
    }

    public Mono<UpdateResult> update(String defaultApplicationId, Map<String, Object> fieldNameValueMap, String branchName) {
        String defaultIdPath = "id";
        if (!isBlank(branchName)) {
            defaultIdPath = "gitApplicationMetadata.defaultApplicationId";
        }
        return repository.updateFieldByDefaultIdAndBranchName(defaultApplicationId, defaultIdPath, fieldNameValueMap,
                branchName, "gitApplicationMetadata.branchName", MANAGE_APPLICATIONS);
    }

    public Mono<Application> update(String defaultApplicationId, Application application, String branchName) {
        return this.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, applicationPermission.getEditPermission())
                .flatMap(branchedApplication -> {
                    application.setPages(null);
                    application.setGitApplicationMetadata(null);
                    return this.update(branchedApplication.getId(), application);
                });
    }

    @Override
    public Mono<Application> archive(Application application) {
        return repository.archive(application);
    }

    @Override
    public Mono<Application> changeViewAccess(String id, ApplicationAccessDTO applicationAccessDTO) {
        Mono<String> publicPermissionGroupIdMono = permissionGroupService.getPublicPermissionGroupId().cache();

        Mono<Application> updateApplicationMono = repository.findById(id, applicationPermission.getMakePublicPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, id)))
                .zipWith(publicPermissionGroupIdMono)
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    String publicPermissionGroupId = tuple.getT2();

                    boolean isApplicationPublic = permissionGroupService.isEntityAccessible(application, applicationPermission.getReadPermission().getValue(), publicPermissionGroupId);

                    // Validity checks before proceeding further
                    if (isApplicationPublic && applicationAccessDTO.getPublicAccess()) {
                        // No change. The required public access is the same as current public access. Do nothing
                        return Mono.just(application);
                    }

                    if (!isApplicationPublic && applicationAccessDTO.getPublicAccess().equals(false)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }

                    // Now update the policies to change the access to the application
                    return generateAndSetPoliciesForView(application, publicPermissionGroupId,
                            applicationAccessDTO.getPublicAccess());
                })
                .flatMap(this::setTransientFields);

        //  Use a synchronous sink which does not take subscription cancellations into account. This that even if the
        //  subscriber has cancelled its subscription, the create method will still generate its event.
        return Mono.create(sink -> updateApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<Application> changeViewAccess(String defaultApplicationId,
                                              String branchName,
                                              ApplicationAccessDTO applicationAccessDTO) {
        // For git connected application update the policy for all the branch's
        return findAllApplicationsByDefaultApplicationId(defaultApplicationId, applicationPermission.getMakePublicPermission())
                .switchIfEmpty(this.findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, applicationPermission.getMakePublicPermission()))
                .flatMap(branchedApplication -> changeViewAccess(branchedApplication.getId(), applicationAccessDTO))
                .then(repository.findById(defaultApplicationId, applicationPermission.getMakePublicPermission())
                        .flatMap(this::setTransientFields)
                        .map(responseUtils::updateApplicationWithDefaultResources));
    }

    @Override
    public Flux<Application> findAllApplicationsByWorkspaceId(String workspaceId) {
        return repository.findByWorkspaceId(workspaceId);
    }

    @Override
    public Mono<Application> getApplicationInViewMode(String defaultApplicationId, String branchName) {

        return this.findBranchedApplicationId(branchName, defaultApplicationId, applicationPermission.getReadPermission())
                .flatMap(this::getApplicationInViewMode)
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    @Override
    public Mono<Application> getApplicationInViewMode(String applicationId) {
        return repository.findById(applicationId, applicationPermission.getReadPermission())
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

    private Mono<? extends Application> generateAndSetPoliciesForView(Application application, String permissionGroupId,
                                                                      Boolean addViewAccess) {

        Map<String, Policy> applicationPolicyMap = policyUtils
                .generatePolicyFromPermissionWithPermissionGroup(READ_APPLICATIONS, permissionGroupId);
        Map<String, Policy> pagePolicyMap = policyUtils
                .generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> actionPolicyMap = policyUtils
                .generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils
                .generatePolicyFromPermissionWithPermissionGroup(datasourcePermission.getExecutePermission(), permissionGroupId);
        Map<String, Policy> themePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, Theme.class
        );

        final Flux<NewPage> updatedPagesFlux = policyUtils
                .updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, addViewAccess);
        // Use the same policy map as actions for action collections since action collections have the same kind of permissions
        final Flux<ActionCollection> updatedActionCollectionsFlux = policyUtils
                .updateWithPagePermissionsToAllItsActionCollections(application.getId(), actionPolicyMap, addViewAccess);
        Flux<Theme> updatedThemesFlux = policyUtils.updateThemePolicies(application, themePolicyMap, addViewAccess);
        final Flux<NewAction> updatedActionsFlux = updatedPagesFlux
                .collectList()
                .thenMany(updatedActionCollectionsFlux)
                .collectList()
                .then(Mono.justOrEmpty(application.getId()))
                .thenMany(updatedThemesFlux)
                .collectList()
                .flatMapMany(applicationId -> policyUtils.updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, addViewAccess));

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
                    Mono<List<Datasource>> updatedDatasourcesMono =
                            policyUtils.updateWithNewPoliciesToDatasourcesByDatasourceIds(datasourceIds,
                                            datasourcePolicyMap, addViewAccess)
                                    .collectList();

                    return updatedDatasourcesMono;
                })
                .thenReturn(application)
                .flatMap(app -> {
                    Application updatedApplication;
                    if (addViewAccess) {
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
        Flux<String> publicPermissionGroupIdFlux = permissionGroupService.getPublicPermissionGroupId().cache().repeat();

        // Set isPublic field if the application is public
        Flux<Application> updatedApplicationWithIsPublicFlux = permissionGroupService.getPublicPermissionGroupId().cache().repeat()
                .zipWith(applicationsFlux)
                .map(tuple -> {
                    Application application = tuple.getT2();
                    String publicPermissionGroupId = tuple.getT1();

                    application.setIsPublic(permissionGroupService.isEntityAccessible(application, applicationPermission.getReadPermission().getValue(), publicPermissionGroupId));

                    return application;
                });

        return configService.getTemplateApplications()
                .map(application -> application.getId())
                .defaultIfEmpty("")
                .collectList()
                .cache()
                .repeat()
                .zipWith(updatedApplicationWithIsPublicFlux)
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
     *
     * @param applicationId application for which the SSH key needs to be generated
     * @return public key which will be used by user to copy to relevant platform
     */
    @Override
    public Mono<GitAuth> createOrUpdateSshKeyPair(String applicationId, String keyType) {
        GitAuth gitAuth = GitDeployKeyGenerator.generateSSHKey(keyType);
        return repository.findById(applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application", applicationId)
                ))
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    // Check if the current application is the root application

                    if (gitData != null
                            && !StringUtils.isEmpty(gitData.getDefaultApplicationId())
                            && applicationId.equals(gitData.getDefaultApplicationId())) {
                        // This is the root application with update SSH key request
                        gitAuth.setRegeneratedKey(true);
                        gitData.setGitAuth(gitAuth);
                        return save(application);
                    } else if (gitData == null) {
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
                    gitAuth.setRegeneratedKey(true);

                    return repository.findById(gitData.getDefaultApplicationId(), applicationPermission.getEditPermission())
                            .flatMap(defaultApplication -> {
                                GitApplicationMetadata gitApplicationMetadata = defaultApplication.getGitApplicationMetadata();
                                gitApplicationMetadata.setDefaultApplicationId(defaultApplication.getId());
                                gitApplicationMetadata.setGitAuth(gitAuth);
                                defaultApplication.setGitApplicationMetadata(gitApplicationMetadata);
                                return save(defaultApplication);
                            });
                })
                .flatMap(application -> {
                    // Send generate SSH key analytics event
                    assert application.getId() != null;
                    final Map<String, Object> eventData = Map.of(
                            FieldName.APP_MODE, ApplicationMode.EDIT.toString(),
                            FieldName.APPLICATION, application
                    );
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, application.getId(),
                            "organizationId", application.getWorkspaceId(),
                            "isRegeneratedKey", gitAuth.isRegeneratedKey(),
                            FieldName.EVENT_DATA, eventData
                    );
                    return analyticsService.sendObjectEvent(AnalyticsEvents.GENERATE_SSH_KEY, application, data)
                            .onErrorResume(e -> {
                                log.warn("Error sending ssh key generation data point", e);
                                return Mono.just(application);
                            });
                })
                .thenReturn(gitAuth);
    }

    /**
     * Method to get the SSH public key
     *
     * @param applicationId application for which the SSH key is requested
     * @return public SSH key
     */
    @Override
    public Mono<GitAuthDTO> getSshKey(String applicationId) {
        return repository.findById(applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId))
                )
                .flatMap(application -> {
                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    List<GitDeployKeyDTO> gitDeployKeyDTOList = GitDeployKeyGenerator.getSupportedProtocols();
                    if (gitData == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Can't find valid SSH key. Please configure the application with git"
                        ));
                    }
                    // Check if the application is root application
                    if (applicationId.equals(gitData.getDefaultApplicationId())) {
                        gitData.getGitAuth().setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
                        GitAuthDTO gitAuthDTO = new GitAuthDTO();
                        gitAuthDTO.setPublicKey(gitData.getGitAuth().getPublicKey());
                        gitAuthDTO.setPrivateKey(gitData.getGitAuth().getPrivateKey());
                        gitAuthDTO.setDocUrl(gitData.getGitAuth().getDocUrl());
                        gitAuthDTO.setGitSupportedSSHKeyType(gitDeployKeyDTOList);
                        return Mono.just(gitAuthDTO);
                    }
                    if (gitData.getDefaultApplicationId() == null) {
                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Can't find root application. Please configure the application with git"
                        );
                    }


                    return repository.findById(gitData.getDefaultApplicationId(), applicationPermission.getEditPermission())
                            .map(rootApplication -> {
                                GitAuthDTO gitAuthDTO = new GitAuthDTO();
                                GitAuth gitAuth = rootApplication.getGitApplicationMetadata().getGitAuth();
                                gitAuth.setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
                                gitAuthDTO.setPublicKey(gitAuth.getPublicKey());
                                gitAuthDTO.setPrivateKey(gitAuth.getPrivateKey());
                                gitAuthDTO.setDocUrl(gitAuth.getDocUrl());
                                gitAuthDTO.setGitSupportedSSHKeyType(gitDeployKeyDTOList);
                                return gitAuthDTO;
                            });
                });
    }

    public Mono<Application> findByBranchNameAndDefaultApplicationId(String branchName,
                                                                     String defaultApplicationId,
                                                                     AclPermission aclPermission) {
        return findByBranchNameAndDefaultApplicationId(branchName, defaultApplicationId, null, aclPermission);
    }

    @Override
    public Mono<Application> findByBranchNameAndDefaultApplicationId(String branchName,
                                                                     String defaultApplicationId,
                                                                     List<String> projectionFieldNames,
                                                                     AclPermission aclPermission) {
        if (StringUtils.isEmpty(branchName)) {
            return repository.findById(defaultApplicationId, projectionFieldNames, aclPermission)
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultApplicationId))
                    );
        }
        return repository.getApplicationByGitBranchAndDefaultApplicationId(defaultApplicationId, projectionFieldNames
                        , branchName, aclPermission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultApplicationId + "," + branchName))
                );
    }

    @Override
    public Mono<Application> findByBranchNameAndDefaultApplicationIdAndFieldName(String branchName,
                                                                                 String defaultApplicationId,
                                                                                 String fieldName,
                                                                                 AclPermission aclPermission) {
        if (StringUtils.isEmpty(branchName)) {
            return repository.findById(defaultApplicationId, aclPermission)
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultApplicationId))
                    );
        }

        return repository.getApplicationByGitBranchAndDefaultApplicationId(defaultApplicationId, branchName, aclPermission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultApplicationId + "," + branchName))
                );
    }

    /**
     * Sets the updatedAt and modifiedBy fields of the Application
     *
     * @param applicationId Application ID
     * @return Application Mono of updated Application
     */
    @Override
    public Mono<Application> saveLastEditInformation(String applicationId) {
        Application application = new Application();
        // need to set isPublic=null because it has a `false` as it's default value in domain class
        application.setIsPublic(null);
        application.setLastEditedAt(Instant.now());
        application.setIsManualUpdate(true);
        /*
          We're not setting updatedAt and modifiedBy fields to the application DTO because these fields will be set
          by the updateById method of the BaseAppsmithRepositoryImpl
         */
        return repository.updateById(applicationId, application, applicationPermission.getEditPermission()) // it'll do a set operation
                .flatMap(this::setTransientFields);
    }

    public Mono<String> findBranchedApplicationId(String branchName, String defaultApplicationId, AclPermission permission) {
        if (StringUtils.isEmpty(branchName)) {
            if (StringUtils.isEmpty(defaultApplicationId)) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID, defaultApplicationId));
            }
            return Mono.just(defaultApplicationId);
        }
        return repository.getApplicationByGitBranchAndDefaultApplicationId(defaultApplicationId, branchName, permission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultApplicationId + ", " + branchName))
                )
                .map(Application::getId);
    }

    /**
     * As part of git sync feature a new application will be created for each branch with reference to main application
     * feat/new-branch ----> new application in Appsmith
     * Get all the applications which refer to the current application and archive those first one by one
     * GitApplicationMetadata has a field called defaultApplicationId which refers to the main application
     *
     * @param defaultApplicationId Main Application from which the branch was created
     * @return Application flux which match the condition
     */
    @Override
    public Flux<Application> findAllApplicationsByDefaultApplicationId(String defaultApplicationId, AclPermission permission) {
        return repository.getApplicationByGitDefaultApplicationId(defaultApplicationId, permission);
    }

    @Override
    public Mono<Long> getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(String workspaceId) {
        return repository.getGitConnectedApplicationWithPrivateRepoCount(workspaceId);
    }

    @Override
    public Flux<Application> getGitConnectedApplicationsByWorkspaceId(String workspaceId) {
        return repository.getGitConnectedApplicationByWorkspaceId(workspaceId);
    }

    public String getRandomAppCardColor() {
        int randomColorIndex = (int) (System.currentTimeMillis() % ApplicationConstants.APP_CARD_COLORS.length);
        return ApplicationConstants.APP_CARD_COLORS[randomColorIndex];
    }

    @Override
    public Mono<UpdateResult> setAppTheme(String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission) {
        return repository.setAppTheme(applicationId, editModeThemeId, publishedModeThemeId, aclPermission);
    }

    @Override
    public Mono<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId) {
        return repository.getApplicationByDefaultApplicationIdAndDefaultBranch(defaultApplicationId);
    }

    @Override
    public Mono<Application> findByIdAndExportWithConfiguration(String applicationId, Boolean exportWithConfiguration) {
        return repository.findByIdAndExportWithConfiguration(applicationId, exportWithConfiguration);
    }
}
