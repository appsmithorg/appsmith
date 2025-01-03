package com.appsmith.server.applications.base;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.artifacts.base.artifactbased.ArtifactBasedServiceCE;
import com.appsmith.server.artifacts.permissions.ArtifactPermission;
import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.GitAuthDTO;
import com.appsmith.server.dtos.GitDeployKeyDTO;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exceptions.util.DuplicateKeyExceptionUtils;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static com.appsmith.external.constants.spans.ce.ApplicationSpanCE.APPLICATION_FETCH_FROM_DB;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.constants.Constraint.MAX_LOGO_SIZE_KB;
import static com.appsmith.server.helpers.ReactorUtils.asMono;
import static com.appsmith.server.helpers.ce.DomainSorter.sortDomainsBasedOnOrderedDomainIds;

@Slf4j
@Service
public class ApplicationServiceCEImpl
        extends BaseService<ApplicationRepository, ApplicationRepositoryCake, Application, String>
        implements ApplicationServiceCE, ArtifactBasedServiceCE<Application> {

    private final PolicySolution policySolution;
    private final PermissionGroupService permissionGroupService;
    private final NewActionRepositoryCake newActionRepository;
    private final AssetService assetService;

    private final DatasourcePermission datasourcePermission;
    private final ApplicationPermission applicationPermission;
    private final SessionUserService sessionUserService;
    private final UserDataService userDataService;
    private final WorkspaceService workspaceService;
    private final WorkspacePermission workspacePermission;
    private final ObservationRegistry observationRegistry;

    private static final Integer MAX_RETRIES = 5;

    @Autowired
    public ApplicationServiceCEImpl(
            Validator validator,
            ApplicationRepository repositoryDirect,
            ApplicationRepositoryCake repository,
            AnalyticsService analyticsService,
            PolicySolution policySolution,
            PermissionGroupService permissionGroupService,
            NewActionRepositoryCake newActionRepository,
            AssetService assetService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            SessionUserService sessionUserService,
            UserDataService userDataService,
            WorkspaceService workspaceService,
            WorkspacePermission workspacePermission,
            ObservationRegistry observationRegistry) {

        super(validator, repositoryDirect, repository, analyticsService);
        this.policySolution = policySolution;
        this.permissionGroupService = permissionGroupService;
        this.newActionRepository = newActionRepository;
        this.assetService = assetService;
        this.datasourcePermission = datasourcePermission;
        this.applicationPermission = applicationPermission;
        this.sessionUserService = sessionUserService;
        this.userDataService = userDataService;
        this.workspaceService = workspaceService;
        this.workspacePermission = workspacePermission;
        this.observationRegistry = observationRegistry;
    }

    @Override
    public Mono<Application> getById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return ReactiveContextUtils.getCurrentUser()
                .flatMap(user ->
                        asMono(() -> repositoryDirect.findById(id, applicationPermission.getReadPermission(), user)))
                .flatMap(this::setTransientFields)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, id)));
    }

    @Override
    public Mono<Application> findByBranchedId(String id, List<String> projectionFieldNames) {
        return asMono(() -> repository
                        .queryBuilder()
                        .byId(id)
                        .fields(projectionFieldNames)
                        .one())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, id)));
    }

    @Override
    public Mono<Application> findById(String id) {
        return repository.findById(id).flatMap(this::setTransientFields);
    }

    @Override
    public Mono<Application> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission).flatMap(this::setTransientFields);
    }

    @Override
    public Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        return setTransientFields(repository.findByWorkspaceId(workspaceId, permission));
    }

    /**
     * This method is used to fetch all the applications for a given workspaceId. It also sorts the applications based
     * on recently used order.
     * For git connected applications only default branched application is returned.
     *
     * @param workspaceId workspaceId for which applications are to be fetched
     * @return Flux of applications
     */
    @Override
    public Flux<Application> findByWorkspaceIdAndBaseApplicationsInRecentlyUsedOrder(String workspaceId) {

        if (!StringUtils.hasLength(workspaceId)) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        // Read the workspace
        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, workspacePermission.getReadPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        Mono<RecentlyUsedEntityDTO> userDataMono = userDataService
                .getForCurrentUser()
                .defaultIfEmpty(new UserData())
                .map(userData -> {
                    if (userData.getRecentlyUsedEntityIds() == null) {
                        return new RecentlyUsedEntityDTO();
                    }
                    return userData.getRecentlyUsedEntityIds().stream()
                            .filter(entityDTO -> workspaceId.equals(entityDTO.getWorkspaceId()))
                            .findFirst()
                            .orElse(new RecentlyUsedEntityDTO());
                });

        // Collect all the applications as a map with workspace id as a key
        return workspaceMono.thenMany(userDataMono.flatMapMany(
                recentlyUsedEntityDTO -> this.findByWorkspaceId(workspaceId, applicationPermission.getReadPermission())
                        // sort transformation
                        .transform(domainFlux -> sortDomainsBasedOnOrderedDomainIds(
                                domainFlux, recentlyUsedEntityDTO.getApplicationIds()))
                        .filter(application -> {
                            /*
                             * Filter applications based on the following criteria:
                             * - Applications that are not connected to Git.
                             * - Applications that, when connected, revert with default branch only.
                             */
                            return !GitUtils.isApplicationConnectedToGit(application)
                                    || GitUtils.isDefaultBranchedApplication(application);
                        })));
    }

    @Override
    public Mono<Application> save(Artifact artifact) {
        Application application = (Application) artifact;
        if (!StringUtils.isEmpty(application.getName())) {
            application.setSlug(TextUtils.makeSlug(application.getName()));
        }

        if (application.getApplicationVersion() != null) {
            int appVersion = application.getApplicationVersion();
            if (appVersion < ApplicationVersion.EARLIEST_VERSION || appVersion > ApplicationVersion.LATEST_VERSION) {
                return Mono.error(
                        new AppsmithException(AppsmithError.INVALID_PARAMETER, Application.Fields.applicationVersion));
            }
        }
        return repository.save(application).flatMap(this::setTransientFields);
    }

    @Override
    public ArtifactPermission getPermissionService() {
        return applicationPermission;
    }

    @Override
    public Mono<Application> create(Application object) {
        throw new UnsupportedOperationException(
                "Please use `ApplicationPageService.createApplication` to create an application.");
    }

    /**
     * Tries to create the given application with the name, over and over again with an incremented suffix, but **only**
     * if the error is because of a name clash.
     *
     * @param application Application to create.
     * @param name        Name of the application, to which numbered suffixes will be appended.
     * @param suffix      Suffix used for appending, recursion artifact. Usually set to 0.
     * @return A Mono that yields the created application.
     */
    private Mono<Application> createSuffixedApplication(Application application, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        application.setName(actualName);
        application.setSlug(TextUtils.makeSlug(application.getName()));
        application.setLastEditedAt(Instant.now());
        if (!StringUtils.hasLength(application.getColor())) {
            application.setColor(getRandomAppCardColor());
        }
        return super.create(application).onErrorResume(DataIntegrityViolationException.class, error -> {
            if (error.getMessage() != null
                    // Catch only if error message contains workspace_app_deleted_git_application_metadata mongo error
                    && (error.getMessage().contains("application_workspace_name_key")
                            || error.getMessage()
                                    .contains("application_workspace_name_git_application_metadata_key"))) {
                if (suffix > MAX_RETRIES) {
                    return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY_PAGE_RELOAD, name));
                } else {
                    // The duplicate key error is because of the `name` field.
                    return createSuffixedApplication(application, name, suffix + 1);
                }
            }
            throw error;
        });
    }

    /**
     * A public method which creates a default application by calling createSuffixedApplication which will retry with
     * incremental suffix if there is name clash.
     *
     * @param application Application to create.
     * @return A Mono that yields the created application.
     */
    @Override
    public Mono<Application> createBaseApplication(Application application) {
        return createSuffixedApplication(application, application.getName(), 0);
    }

    @Override
    public Mono<Application> update(String id, Application application) {
        return sessionUserService.getCurrentUser().flatMap(currentUser -> {
            application.setModifiedBy(currentUser.getUsername());
            application.setIsPublic(null);
            application.setLastEditedAt(Instant.now());
            if (!StringUtils.isEmpty(application.getName())) {
                application.setSlug(TextUtils.makeSlug(application.getName()));
            }

            if (application.getApplicationVersion() != null) {
                int appVersion = application.getApplicationVersion();
                if (appVersion < ApplicationVersion.EARLIEST_VERSION
                        || appVersion > ApplicationVersion.LATEST_VERSION) {
                    return Mono.error(new AppsmithException(
                            AppsmithError.INVALID_PARAMETER, Application.Fields.applicationVersion));
                }
            }

            Mono<String> applicationIdMono;
            GitArtifactMetadata gitData = application.getGitApplicationMetadata();
            if (gitData != null
                    && !StringUtils.isEmpty(gitData.getRefName())
                    && !StringUtils.isEmpty(gitData.getDefaultArtifactId())) {
                applicationIdMono = this.findByBranchNameAndBaseApplicationId(
                                gitData.getRefName(),
                                gitData.getDefaultArtifactId(),
                                applicationPermission.getEditPermission())
                        .map(Application::getId);
            } else {
                applicationIdMono = Mono.just(id);
            }
            return applicationIdMono.flatMap(appId -> repository
                    .updateById(appId, application, applicationPermission.getEditPermission())
                    .onErrorResume(error -> {
                        log.error("failed to update application {}", appId, error);
                        if (error instanceof DataIntegrityViolationException) {
                            // Error message : E11000 duplicate key error collection: appsmith.application index:
                            // workspace_app_deleted_git_application_metadata dup key:
                            // { organizationId: "******", name: "AppName", deletedAt: null }
                            if (error.getCause()
                                    .getMessage()
                                    .contains("workspace_app_deleted_git_application_metadata")) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.DUPLICATE_KEY_USER_ERROR, FieldName.APPLICATION, FieldName.NAME));
                            }
                            return Mono.error(new AppsmithException(
                                    AppsmithError.DUPLICATE_KEY,
                                    DuplicateKeyExceptionUtils.extractConflictingObjectName(
                                            error.getCause().getMessage())));
                        }
                        return Mono.error(error);
                    })
                    .flatMap(application1 -> this.setTransientFields(application1))
                    .flatMap(application1 -> {
                        final Map<String, Object> eventData = Map.of(
                                FieldName.APP_MODE,
                                ApplicationMode.EDIT.toString(),
                                FieldName.APPLICATION,
                                application1);
                        final Map<String, Object> data = Map.of(
                                FieldName.APPLICATION_ID, application1.getId(),
                                FieldName.WORKSPACE_ID, application1.getWorkspaceId(),
                                FieldName.EVENT_DATA, eventData);
                        return analyticsService.sendUpdateEvent(application1, data);
                    }));
        });
    }

    public Mono<Integer> updateByBranchedIdAndFieldsMap(
            String branchedApplicationId, Map<String, Object> fieldNameValueMap) {
        return repository.updateFieldById(
                branchedApplicationId, Application.Fields.id, fieldNameValueMap, MANAGE_APPLICATIONS);
    }

    public Mono<Application> updateApplicationWithPresets(String branchedApplicationId, Application application) {
        return this.findById(branchedApplicationId, applicationPermission.getEditPermission())
                .flatMap(branchedApplication -> {
                    application.setPages(null);
                    application.setGitApplicationMetadata(null);

                    return verifyIfForkingIsAllowed(branchedApplication, application)
                            .then(updateApplication(application, branchedApplication));
                });
    }

    private Mono<Application> updateApplication(Application application, Application branchedApplication) {
        /**
         * Retaining the logoAssetId field value while updating NavigationSetting
         */
        if (application.getUnpublishedApplicationDetail() != null) {
            ApplicationDetail presetApplicationDetail =
                    ObjectUtils.defaultIfNull(branchedApplication.getApplicationDetail(), new ApplicationDetail());
            if (branchedApplication.getUnpublishedApplicationDetail() == null) {
                branchedApplication.setUnpublishedApplicationDetail(new ApplicationDetail());
            }
            Application.NavigationSetting requestNavSetting =
                    application.getUnpublishedApplicationDetail().getNavigationSetting();
            if (requestNavSetting != null) {
                Application.NavigationSetting presetNavSetting = ObjectUtils.defaultIfNull(
                        branchedApplication.getUnpublishedApplicationDetail().getNavigationSetting(),
                        new Application.NavigationSetting());
                String presetLogoAssetId = ObjectUtils.defaultIfNull(presetNavSetting.getLogoAssetId(), "");
                String requestLogoAssetId = ObjectUtils.defaultIfNull(requestNavSetting.getLogoAssetId(), null);
                requestNavSetting.setLogoAssetId(ObjectUtils.defaultIfNull(requestLogoAssetId, presetLogoAssetId));
                presetApplicationDetail.setNavigationSetting(requestNavSetting);
            }

            Application.AppPositioning requestAppPositioning =
                    application.getUnpublishedApplicationDetail().getAppPositioning();
            if (requestAppPositioning != null) {
                presetApplicationDetail.setAppPositioning(requestAppPositioning);
            }
            Application.ThemeSetting requestThemeSettings =
                    application.getUnpublishedApplicationDetail().getThemeSetting();
            if (requestThemeSettings != null) {
                presetApplicationDetail.setThemeSetting(requestThemeSettings);
            }
            application.setUnpublishedApplicationDetail(presetApplicationDetail);
        }
        return this.update(branchedApplication.getId(), application);
    }

    /**
     * This method is a placeholder in the Community Edition (CE) repository. It is designed to be overridden in
     * derived classes in the Enterprise Edition (EE) where the actual logic to verify if forking is allowed will be
     * implemented. In CE, forking is always allowed up to this point, hence the method returns an empty Mono.
     */
    protected Mono<Void> verifyIfForkingIsAllowed(Application branchedApplication, Application applicationReq) {
        return Mono.empty().then();
    }

    @Override
    public Mono<Application> archive(Application application) {
        return repository.archive(application);
    }

    @Override
    public Mono<Application> changeViewAccessForSingleBranchByBranchedApplicationId(
            String branchedApplicationId, ApplicationAccessDTO applicationAccessDTO) {
        Mono<String> publicPermissionGroupIdMono =
                permissionGroupService.getPublicPermissionGroupId().cache();

        Mono<Application> updateApplicationMono = repository
                .findById(branchedApplicationId, applicationPermission.getMakePublicPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId)))
                .zipWith(publicPermissionGroupIdMono)
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    String publicPermissionGroupId = tuple.getT2();

                    boolean isApplicationPublic = permissionGroupService.isEntityAccessible(
                            application,
                            applicationPermission.getReadPermission().getValue(),
                            publicPermissionGroupId);

                    if (applicationAccessDTO.getPublicAccess().equals(isApplicationPublic)) {
                        // No change. Return the application as is.
                        return Mono.just(application);
                    }

                    // Now update the policies to change the access to the application
                    return generateAndSetPoliciesForPublicView(
                            application, publicPermissionGroupId, applicationAccessDTO.getPublicAccess());
                })
                .flatMap(this::setTransientFields);

        //  Use a synchronous sink which does not take subscription cancellations into account. This that even if the
        //  subscriber has cancelled its subscription, the create method will still generate its event.
        return Mono.create(
                sink -> updateApplicationMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<Application> changeViewAccessForAllBranchesByBranchedApplicationId(
            String branchedApplicationId, ApplicationAccessDTO applicationAccessDTO) {
        // For git connected application update the policy for all the branch's
        return findAllBranchedApplicationIdsByBranchedApplicationId(
                        branchedApplicationId, applicationPermission.getMakePublicPermission())
                .switchIfEmpty(Mono.just(branchedApplicationId))
                .flatMap(branchedApplicationId1 -> changeViewAccessForSingleBranchByBranchedApplicationId(
                        branchedApplicationId1, applicationAccessDTO))
                .then(repository
                        .findById(branchedApplicationId, applicationPermission.getMakePublicPermission())
                        .flatMap(this::setTransientFields));
    }

    @Override
    public Flux<Application> findAllApplicationsByWorkspaceId(String workspaceId) {
        return repository.findByWorkspaceId(workspaceId);
    }

    @Override
    public Mono<Application> getApplicationInViewMode(String applicationId) {
        return repository
                .findById(applicationId, applicationPermission.getReadPermission())
                .map(application -> {
                    application.setViewMode(true);
                    return application;
                });
    }

    private Mono<? extends Application> generateAndSetPoliciesForPublicView(
            Application application, String permissionGroupId, Boolean addViewAccess) {

        Map<String, Policy> applicationPolicyMap =
                policySolution.generatePolicyFromPermissionWithPermissionGroup(READ_APPLICATIONS, permissionGroupId);

        Flux<String> otherApplicationsForThisRoleFlux = repository
                .getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
                        application.getWorkspaceId(), READ_APPLICATIONS, permissionGroupId)
                .filter(applicationId -> !application.getId().equals(applicationId))
                .cache();

        List<Mono<Void>> updateInheritedDomainsList =
                updatePoliciesForInheritingDomains(application, applicationPolicyMap, addViewAccess);
        List<Mono<Void>> updateIndependentDomainsList = updatePoliciesForIndependentDomains(
                application, permissionGroupId, addViewAccess, otherApplicationsForThisRoleFlux);

        return Flux.fromIterable(updateInheritedDomainsList)
                .flatMap(voidMono -> voidMono)
                .thenMany(Flux.fromIterable(updateIndependentDomainsList))
                .flatMap(voidMono -> voidMono)
                .then(Mono.just(application))
                .flatMap(app -> {
                    Application updatedApplication;
                    if (addViewAccess) {
                        updatedApplication =
                                policySolution.addPoliciesToExistingObject(applicationPolicyMap, application);
                    } else {
                        updatedApplication =
                                policySolution.removePoliciesFromExistingObject(applicationPolicyMap, application);
                    }
                    return repository.save(updatedApplication);
                });
    }

    protected List<Mono<Void>> updatePoliciesForIndependentDomains(
            Application application,
            String permissionGroupId,
            Boolean addViewAccess,
            Flux<String> otherApplicationsWithAccessFlux) {

        List<Mono<Void>> list = new ArrayList<>();

        Map<String, Policy> datasourcePolicyMap = policySolution.generatePolicyFromPermissionWithPermissionGroup(
                datasourcePermission.getExecutePermission(), permissionGroupId);

        Set<String> existingDatasourceIds = ConcurrentHashMap.newKeySet();
        Set<String> newDatasourceIds = ConcurrentHashMap.newKeySet();

        Mono<Void> existingDatasourceIdsMono = otherApplicationsWithAccessFlux
                .flatMap(ids -> newActionRepository.findByApplicationId(ids))
                .map(action -> {
                    ActionDTO unpublishedAction = action.getUnpublishedAction();
                    ActionDTO publishedAction = action.getPublishedAction();

                    if (unpublishedAction.getDatasource() != null
                            && unpublishedAction.getDatasource().getId() != null) {
                        existingDatasourceIds.add(
                                unpublishedAction.getDatasource().getId());
                    }

                    if (publishedAction != null
                            && publishedAction.getDatasource() != null
                            && publishedAction.getDatasource().getId() != null) {
                        existingDatasourceIds.add(
                                publishedAction.getDatasource().getId());
                    }
                    return action;
                })
                .then();

        Mono<Void> newDatasourceIdsMono = newActionRepository
                .findByApplicationId(application.getId())
                .map(action -> {
                    ActionDTO unpublishedAction = action.getUnpublishedAction();
                    ActionDTO publishedAction = action.getPublishedAction();

                    if (unpublishedAction.getDatasource() != null
                            && unpublishedAction.getDatasource().getId() != null) {
                        newDatasourceIds.add(unpublishedAction.getDatasource().getId());
                    }

                    if (publishedAction != null
                            && publishedAction.getDatasource() != null
                            && publishedAction.getDatasource().getId() != null) {
                        newDatasourceIds.add(publishedAction.getDatasource().getId());
                    }
                    return action;
                })
                .then();

        Mono<Set<String>> datasourceIdsMono = Mono.when(existingDatasourceIdsMono, newDatasourceIdsMono)
                .then(Mono.fromCallable(() -> {
                    // We want to change permissions for all the datasources related to the new application
                    HashSet<String> datasourceIds = new HashSet<>(newDatasourceIds);
                    // But disregard anything that is being used in other applications as well
                    datasourceIds.removeAll(existingDatasourceIds);
                    return datasourceIds;
                }));

        // Update the datasource policies without permission since the applications and datasources are at
        // the same level in the hierarchy. A user may have permission to change view on application, but
        // may not have explicit permissions on the datasource.
        Mono<Void> updatedDatasourcesMono = datasourceIdsMono
                .flatMapMany(datasourceIds -> {
                    return policySolution.updateWithNewPoliciesToDatasourcesByDatasourceIdsWithoutPermission(
                            datasourceIds, datasourcePolicyMap, addViewAccess);
                })
                .then();

        list.add(updatedDatasourcesMono);

        return list;
    }

    protected List<Mono<Void>> updatePoliciesForInheritingDomains(
            Application application, Map<String, Policy> applicationPolicyMap, Boolean addViewAccess) {

        List<Mono<Void>> list = new ArrayList<>();

        Map<String, Policy> pagePolicyMap = policySolution.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, NewPage.class);
        Map<String, Policy> actionPolicyMap = policySolution.generateInheritedPoliciesFromSourcePolicies(
                pagePolicyMap, NewPage.class, NewAction.class);
        Map<String, Policy> themePolicyMap = policySolution.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, Theme.class);

        final Mono<Void> updatedPagesMono = policySolution
                .updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, addViewAccess)
                .then();
        list.add(updatedPagesMono);
        final Mono<Void> updatedActionsMono = policySolution
                .updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, addViewAccess)
                .then();
        list.add(updatedActionsMono);
        // Use the same policy map as actions for action collections since action collections have the same kind of
        // permissions
        final Mono<Void> updatedActionCollectionsMono = policySolution
                .updateWithPagePermissionsToAllItsActionCollections(application.getId(), actionPolicyMap, addViewAccess)
                .then();
        list.add(updatedActionCollectionsMono);
        final Mono<Void> updatedThemesMono = policySolution
                .updateThemePolicies(application, themePolicyMap, addViewAccess)
                .then();
        list.add(updatedThemesMono);

        return list;
    }

    public Mono<Application> setTransientFields(Application application) {
        return setTransientFields(Flux.just(application)).last();
    }

    private Flux<Application> setTransientFields(Flux<Application> applicationsFlux) {
        Flux<String> publicPermissionGroupIdFlux =
                permissionGroupService.getPublicPermissionGroupId().cache().repeat();

        // Set isPublic field if the application is public
        return publicPermissionGroupIdFlux.zipWith(applicationsFlux).map(tuple -> {
            Application application = tuple.getT2();
            String publicPermissionGroupId = tuple.getT1();

            application.setIsPublic(permissionGroupService.isEntityAccessible(
                    application, applicationPermission.getReadPermission().getValue(), publicPermissionGroupId));

            return application;
        });
    }

    /**
     * Method to get the SSH public key
     *
     * @param applicationId application for which the SSH key is requested
     * @return public SSH key
     */
    @Override
    public Mono<GitAuthDTO> getSshKey(String applicationId) {
        return repository
                .findById(applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)))
                .flatMap(application -> {
                    GitArtifactMetadata gitData = application.getGitApplicationMetadata();
                    List<GitDeployKeyDTO> gitDeployKeyDTOList = GitDeployKeyGenerator.getSupportedProtocols();
                    if (gitData == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Can't find valid SSH key. Please configure the application with git"));
                    }
                    // Check if the application is root application
                    if (applicationId.equals(gitData.getDefaultArtifactId())) {
                        gitData.getGitAuth().setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
                        GitAuthDTO gitAuthDTO = new GitAuthDTO();
                        gitAuthDTO.setPublicKey(gitData.getGitAuth().getPublicKey());
                        gitAuthDTO.setPrivateKey(gitData.getGitAuth().getPrivateKey());
                        gitAuthDTO.setDocUrl(gitData.getGitAuth().getDocUrl());
                        gitAuthDTO.setGitSupportedSSHKeyType(gitDeployKeyDTOList);
                        return Mono.just(gitAuthDTO);
                    }
                    if (gitData.getDefaultArtifactId() == null) {
                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Can't find root application. Please configure the application with git");
                    }

                    return repository
                            .findById(gitData.getDefaultArtifactId(), applicationPermission.getEditPermission())
                            .map(rootApplication -> {
                                GitAuthDTO gitAuthDTO = new GitAuthDTO();
                                GitAuth gitAuth = rootApplication
                                        .getGitApplicationMetadata()
                                        .getGitAuth();
                                gitAuth.setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
                                gitAuthDTO.setPublicKey(gitAuth.getPublicKey());
                                gitAuthDTO.setPrivateKey(gitAuth.getPrivateKey());
                                gitAuthDTO.setDocUrl(gitAuth.getDocUrl());
                                gitAuthDTO.setGitSupportedSSHKeyType(gitDeployKeyDTOList);
                                return gitAuthDTO;
                            });
                });
    }

    public Mono<Application> findByBranchNameAndBaseApplicationId(
            String branchName, String baseApplicationId, AclPermission aclPermission) {
        return findByBranchNameAndBaseApplicationId(branchName, baseApplicationId, null, aclPermission);
    }

    @Override
    public Mono<Application> findByBranchNameAndBaseApplicationId(
            String branchName,
            String baseApplicationId,
            List<String> projectionFieldNames,
            AclPermission aclPermission) {
        if (StringUtils.isEmpty(branchName)) {
            Mono<User> currentUserMono = sessionUserService.getCurrentUser();
            return currentUserMono
                    .flatMap(user -> asMono(() -> repository
                            .queryBuilder()
                            .byId(baseApplicationId)
                            .fields(projectionFieldNames)
                            .permission(aclPermission, user)
                            .one()))
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, baseApplicationId)));
        }
        return repository
                .getApplicationByGitBranchAndBaseApplicationId(
                        baseApplicationId, projectionFieldNames, branchName, aclPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, baseApplicationId + "," + branchName)));
    }

    /**
     * Sets the updatedAt and modifiedBy fields of the Application
     *
     * @param applicationId Application ID
     * @return Application Mono of updated Application
     */
    @Override
    public Mono<Application> saveLastEditInformation(String applicationId) {
        return sessionUserService.getCurrentUser().flatMap(currentUser -> {
            Application application = new Application();
            // need to set isPublic=null because it has a `false` as it's default value in domain class
            application.setIsPublic(null);
            application.setLastEditedAt(Instant.now());
            application.setIsManualUpdate(true);
            application.setModifiedBy(currentUser.getUsername());
            /*
             We're not setting updatedAt and modifiedBy fields to the application DTO because these fields will be set
             by the updateById method of the BaseAppsmithRepositoryImpl
            */
            return repository
                    .updateById(
                            applicationId,
                            application,
                            applicationPermission.getEditPermission()) // it'll do a set operation
                    .flatMap(this::setTransientFields);
        });
    }

    public Mono<String> findBranchedApplicationId(
            String branchName, String baseApplicationId, AclPermission permission) {
        if (!StringUtils.hasLength(branchName)) {
            if (!StringUtils.hasLength(baseApplicationId)) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID, baseApplicationId));
            }
            return Mono.just(baseApplicationId);
        }
        return repository
                .getApplicationByGitBranchAndBaseApplicationId(baseApplicationId, branchName, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, baseApplicationId + ", " + branchName)))
                .map(application -> application.getId());
    }

    public Mono<String> findBranchedApplicationId(
            Optional<String> branchName, String baseApplicationId, Optional<AclPermission> permission) {
        if (branchName.isEmpty()) {
            if (!StringUtils.hasLength(baseApplicationId)) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID, baseApplicationId));
            }
            return Mono.just(baseApplicationId);
        }
        return repository
                .getApplicationByGitBranchAndBaseApplicationId(
                        baseApplicationId, branchName.get(), permission.orElse(null))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, baseApplicationId + ", " + branchName)))
                .map(Application::getId);
    }

    /**
     * As part of git sync feature a new application will be created for each branch with reference to main application
     * feat/new-branch ----> new application in Appsmith
     * Get all the applications which refer to the current application and archive those first one by one
     * GitApplicationMetadata has a field called defaultApplicationId which refers to the main application
     *
     * @param baseApplicationId Main Application from which the branch was created
     * @return Application flux which match the condition
     */
    @Override
    public Flux<Application> findAllApplicationsByBaseApplicationId(
            String baseApplicationId, AclPermission permission) {
        return repository.getApplicationByGitBaseApplicationId(baseApplicationId, permission);
    }

    @Override
    public Flux<String> findAllBranchedApplicationIdsByBranchedApplicationId(
            String branchedApplicationId, AclPermission permission) {
        return repository.findAllBranchedApplicationIdsByBranchedApplicationId(branchedApplicationId, permission);
    }

    @Override
    public Mono<Long> getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(String workspaceId) {
        return repository.getGitConnectedApplicationWithPrivateRepoCount(workspaceId);
    }

    public String getRandomAppCardColor() {
        int randomColorIndex = (int) (System.currentTimeMillis() % ApplicationConstants.APP_CARD_COLORS.length);
        return ApplicationConstants.APP_CARD_COLORS[randomColorIndex];
    }

    @Override
    public Mono<Integer> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission) {
        return repository.setAppTheme(applicationId, editModeThemeId, publishedModeThemeId, aclPermission);
    }

    @Override
    public Mono<Application> getApplicationByBaseApplicationIdAndDefaultBranch(String baseApplicationId) {
        return repository.getApplicationByBaseApplicationIdAndDefaultBranch(baseApplicationId);
    }

    @Override
    public Mono<Application> findByIdAndExportWithConfiguration(String applicationId, Boolean exportWithConfiguration) {
        return repository.findByIdAndExportWithConfiguration(applicationId, exportWithConfiguration);
    }

    @Override
    public Mono<Application> saveAppNavigationLogo(String branchedApplicationId, Part filePart) {
        return this.findById(branchedApplicationId, applicationPermission.getEditPermission())
                .flatMap(branchedApplication -> {
                    branchedApplication.setUnpublishedApplicationDetail(ObjectUtils.defaultIfNull(
                            branchedApplication.getUnpublishedApplicationDetail(), new ApplicationDetail()));
                    Application.NavigationSetting rootAppUnpublishedNavigationSetting = ObjectUtils.defaultIfNull(
                            branchedApplication
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting(),
                            new Application.NavigationSetting());

                    String rootAppLogoAssetId =
                            ObjectUtils.defaultIfNull(rootAppUnpublishedNavigationSetting.getLogoAssetId(), "");

                    final Mono<String> prevAssetIdMono = Mono.just(rootAppLogoAssetId);

                    final Mono<Asset> uploaderMono = assetService.upload(List.of(filePart), MAX_LOGO_SIZE_KB, false);

                    return Mono.zip(prevAssetIdMono, uploaderMono).flatMap(tuple -> {
                        final String oldAssetId = tuple.getT1();
                        final Asset uploadedAsset = tuple.getT2();
                        Application.NavigationSetting navSetting = ObjectUtils.defaultIfNull(
                                branchedApplication
                                        .getUnpublishedApplicationDetail()
                                        .getNavigationSetting(),
                                new Application.NavigationSetting());
                        navSetting.setLogoAssetId(uploadedAsset.getId());
                        branchedApplication.getUnpublishedApplicationDetail().setNavigationSetting(navSetting);

                        final Mono<Application> updateMono =
                                this.updateApplicationWithPresets(branchedApplicationId, branchedApplication);

                        if (!StringUtils.hasLength(oldAssetId)) {
                            return updateMono;
                        } else {
                            return assetService.remove(oldAssetId).then(updateMono);
                        }
                    });
                });
    }

    @Override
    public Mono<Boolean> isApplicationNameTaken(String applicationName, String workspaceId, AclPermission permission) {
        return repository
                .countByNameAndWorkspaceId(applicationName, workspaceId, permission)
                .map(count -> count > 0);
    }

    @Override
    public Mono<Boolean> isApplicationConnectedToGit(String applicationId) {
        if (!StringUtils.hasLength(applicationId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return this.getById(applicationId).map(GitUtils::isApplicationConnectedToGit);
    }

    @Override
    public Mono<Void> deleteAppNavigationLogo(String branchedApplicationId) {
        return this.findById(branchedApplicationId, applicationPermission.getEditPermission())
                .flatMap(branchedApplication -> {
                    branchedApplication.setUnpublishedApplicationDetail(ObjectUtils.defaultIfNull(
                            branchedApplication.getUnpublishedApplicationDetail(), new ApplicationDetail()));
                    Application.NavigationSetting unpublishedNavSetting = ObjectUtils.defaultIfNull(
                            branchedApplication
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting(),
                            new Application.NavigationSetting());

                    String navLogoAssetId = ObjectUtils.defaultIfNull(unpublishedNavSetting.getLogoAssetId(), "");

                    unpublishedNavSetting.setLogoAssetId(null);
                    branchedApplication.getUnpublishedApplicationDetail().setNavigationSetting(unpublishedNavSetting);
                    return repository.save(branchedApplication).thenReturn(navLogoAssetId);
                })
                .flatMap(assetService::remove);
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(Application savedApplication) {
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put("appName", ObjectUtils.defaultIfNull(savedApplication.getName(), ""));
        analyticsProperties.put("applicationId", ObjectUtils.defaultIfNull(savedApplication.getId(), ""));
        analyticsProperties.put("orgId", ObjectUtils.defaultIfNull(savedApplication.getWorkspaceId(), ""));
        return analyticsProperties;
    }

    @Override
    public Mono<Void> updateProtectedBranches(String applicationId, List<String> protectedBranches) {
        return repository
                .unprotectAllBranches(applicationId, applicationPermission.getEditPermission())
                .then(Mono.defer(() -> {
                    // Mono.defer is used to ensure the following code is executed only after the previous Mono
                    // completes
                    if (protectedBranches != null && !protectedBranches.isEmpty()) {
                        return repository.protectBranchedApplications(
                                applicationId, protectedBranches, applicationPermission.getEditPermission());
                    }
                    return Mono.empty();
                }))
                .then();
    }

    @Override
    public Flux<String> findBranchedApplicationIdsByBaseApplicationId(String baseApplicationId) {
        return repository.findBranchedApplicationIdsByBaseApplicationId(baseApplicationId);
    }

    /**
     * Gets branched application with the right permission set based on mode of application
     *
     * @param defaultApplicationId : default app id
     * @param branchName           : branch name of the application
     * @param mode                 : is it edit mode or view mode
     * @return : returns a publisher of branched application
     */
    @Override
    public Mono<Application> findByBaseIdBranchNameAndApplicationMode(
            String defaultApplicationId, String branchName, ApplicationMode mode) {
        AclPermission permissionForApplication = ApplicationMode.PUBLISHED.equals(mode)
                ? applicationPermission.getReadPermission()
                : applicationPermission.getEditPermission();

        return findByBranchNameAndBaseApplicationId(branchName, defaultApplicationId, permissionForApplication)
                .name(APPLICATION_FETCH_FROM_DB)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Mono<Application> findByBranchedApplicationIdAndApplicationMode(
            String branchedApplicationId, ApplicationMode mode) {
        AclPermission permissionForApplication = ApplicationMode.PUBLISHED.equals(mode)
                ? applicationPermission.getReadPermission()
                : applicationPermission.getEditPermission();

        return findById(branchedApplicationId, permissionForApplication)
                .name(APPLICATION_FETCH_FROM_DB)
                .tap(Micrometer.observation(observationRegistry))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId)));
    }
}
