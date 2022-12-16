package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.UserPermissionUtils;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ce.ApplicationPageServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class ApplicationPageServiceImpl extends ApplicationPageServiceCEImpl implements ApplicationPageService {

    private final ApplicationService applicationService;
    private final PermissionGroupService permissionGroupService;
    private final NewPageRepository newPageRepository;
    private final NewActionRepository newActionRepository;
    private final ActionCollectionRepository actionCollectionRepository;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;



    public ApplicationPageServiceImpl(WorkspaceService workspaceService,
                                      ApplicationService applicationService,
                                      SessionUserService sessionUserService,
                                      WorkspaceRepository workspaceRepository,
                                      LayoutActionService layoutActionService,
                                      AnalyticsService analyticsService,
                                      PolicyGenerator policyGenerator,
                                      ApplicationRepository applicationRepository,
                                      NewPageService newPageService,
                                      NewActionService newActionService,
                                      ActionCollectionService actionCollectionService,
                                      GitFileUtils gitFileUtils,
                                      CommentThreadRepository commentThreadRepository,
                                      ThemeService themeService,
                                      ResponseUtils responseUtils,
                                      WorkspacePermission workspacePermission,
                                      ApplicationPermission applicationPermission,
                                      PagePermission pagePermission,
                                      ActionPermission actionPermission,
                                      PermissionGroupService permissionGroupService,
                                      NewPageRepository newPageRepository,
                                      NewActionRepository newActionRepository,
                                      ActionCollectionRepository actionCollectionRepository,
                                      PagePermission pagePermission1,
                                      ActionPermission actionPermission1) {

        super(workspaceService, applicationService, sessionUserService, workspaceRepository, layoutActionService, analyticsService,
                policyGenerator, applicationRepository, newPageService, newActionService, actionCollectionService,
                gitFileUtils, commentThreadRepository, themeService, responseUtils, workspacePermission,
                applicationPermission, pagePermission, actionPermission);
        this.applicationService = applicationService;
        this.applicationPermission = applicationPermission;
        this.permissionGroupService = permissionGroupService;
        this.newPageRepository = newPageRepository;
        this.newActionRepository = newActionRepository;
        this.actionCollectionRepository = actionCollectionRepository;
        this.pagePermission = pagePermission1;
        this.actionPermission = actionPermission1;
    }

    @Override
    public Mono<Application> publish(String defaultApplicationId, String branchName, boolean isPublishedManually) {
        Mono<Application> applicationMono = applicationService.findBranchedApplicationId(branchName, defaultApplicationId, applicationPermission.getEditPermission())
                .flatMap(branchedApplicationId -> applicationService.findById(branchedApplicationId, applicationPermission.getEditPermission()));

        return Mono.when(validateAllObjectsForPermissions(applicationMono, AppsmithError.UNABLE_TO_DEPLOY_MISSING_PERMISSION))
                .then(super.publish(defaultApplicationId, branchName, isPublishedManually));
    }

    @Override
    public Mono<Application> cloneApplication(String applicationId, String branchName) {
        Mono<Application> applicationMono = applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, applicationPermission.getEditPermission())
                .flatMap(application -> {
                    // For git connected application user can update the default branch
                    // In such cases we should fork the application from the new default branch
                    if (StringUtils.isEmpty(branchName)
                            && !Optional.ofNullable(application.getGitApplicationMetadata()).isEmpty()
                            && !application.getGitApplicationMetadata().getBranchName().equals(application.getGitApplicationMetadata().getDefaultBranchName())) {
                        return applicationService.findByBranchNameAndDefaultApplicationId(
                                application.getGitApplicationMetadata().getDefaultBranchName(),
                                applicationId,
                                applicationPermission.getEditPermission()
                        );
                    }
                    return Mono.just(application);
                }).cache();

        return Mono.when(validateAllObjectsForPermissions(applicationMono, AppsmithError.APPLICATION_NOT_CLONED_MISSING_PERMISSIONS)).then(super.cloneApplication(applicationId, branchName));
    }

    private Mono validateAllObjectsForPermissions(Mono<Application> applicationMono, AppsmithError expectedError) {
        Flux<BaseDomain> pageFlux = applicationMono
                .flatMapMany(application -> newPageRepository
                        .findAllByApplicationIdsWithoutPermission(List.of(application.getId()), List.of("id", "policies"))
                        .flatMap(newPageRepository::setUserPermissionsInObject));
        Flux<BaseDomain> actionFlux = applicationMono
                .flatMapMany(application -> newActionRepository
                        .findAllByApplicationIdsWithoutPermission(List.of(application.getId()), List.of("id", "policies"))
                        .flatMap(newActionRepository::setUserPermissionsInObject));
        Flux<BaseDomain> actionCollectionFlux = applicationMono
                .flatMapMany(application -> actionCollectionRepository
                        .findAllByApplicationIds(List.of(application.getId()), List.of("id", "policies"))
                        .flatMap(actionCollectionRepository::setUserPermissionsInObject));

        Mono<Boolean> pagesValidatedForPermission = UserPermissionUtils.validateDomainObjectPermissionsOrError(pageFlux,
                permissionGroupService.getSessionUserPermissionGroupIds(), pagePermission.getEditPermission(),
                expectedError);
        Mono<Boolean> actionsValidatedForPermission = UserPermissionUtils.validateDomainObjectPermissionsOrError(actionFlux,
                permissionGroupService.getSessionUserPermissionGroupIds(), actionPermission.getEditPermission(),
                expectedError);
        Mono<Boolean> actionCollectionsValidatedForPermission = UserPermissionUtils.validateDomainObjectPermissionsOrError(actionCollectionFlux,
                permissionGroupService.getSessionUserPermissionGroupIds(), actionPermission.getEditPermission(),
                expectedError);
        return Mono.zip(pagesValidatedForPermission, actionsValidatedForPermission, actionCollectionsValidatedForPermission);
    }
}
