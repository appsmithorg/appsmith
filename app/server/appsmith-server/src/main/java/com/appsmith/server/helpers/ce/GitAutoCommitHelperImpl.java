package com.appsmith.server.helpers.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.AutoCommitProgressDTO;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.CommonGitService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.AutoCommitEventHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class GitAutoCommitHelperImpl implements GitAutoCommitHelper {
    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final AutoCommitEventHandler autoCommitEventHandler;
    private final UserDataService userDataService;
    private final FeatureFlagService featureFlagService;
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final RedisUtils redisUtils;
    private final CommonGitService commonGitService;

    public GitAutoCommitHelperImpl(
            GitPrivateRepoHelper gitPrivateRepoHelper,
            AutoCommitEventHandler autoCommitEventHandler,
            UserDataService userDataService,
            FeatureFlagService featureFlagService,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            RedisUtils redisUtils,
            @Lazy CommonGitService commonGitService) {
        this.gitPrivateRepoHelper = gitPrivateRepoHelper;
        this.autoCommitEventHandler = autoCommitEventHandler;
        this.userDataService = userDataService;
        this.featureFlagService = featureFlagService;
        this.applicationService = applicationService;
        this.applicationPermission = applicationPermission;
        this.redisUtils = redisUtils;
        this.commonGitService = commonGitService;
    }

    @Override
    public Mono<AutoCommitProgressDTO> getAutoCommitProgress(String applicationId) {
        return redisUtils
                .getRunningAutoCommitBranchName(applicationId)
                .zipWith(redisUtils.getAutoCommitProgress(applicationId))
                .map(tuple2 -> {
                    AutoCommitProgressDTO autoCommitProgressDTO = new AutoCommitProgressDTO(Boolean.TRUE);
                    autoCommitProgressDTO.setBranchName(tuple2.getT1());
                    autoCommitProgressDTO.setProgress(tuple2.getT2());
                    return autoCommitProgressDTO;
                })
                .defaultIfEmpty(new AutoCommitProgressDTO(Boolean.FALSE));
    }

    @Override
    public Mono<Boolean> autoCommitApplication(String defaultApplicationId, String branchName) {

        // if either param is absent, then application is not connected to git.
        if (!StringUtils.hasText(branchName) || !StringUtils.hasText(defaultApplicationId)) {
            return Mono.just(Boolean.FALSE);
        }

        Mono<Application> applicationMono = applicationService
                .findById(defaultApplicationId, applicationPermission.getEditPermission())
                .cache();

        final String finalBranchName = branchName.replaceFirst("origin/", "");

        Mono<Application> branchedApplicationMono = applicationService
                .findByBranchNameAndDefaultApplicationId(
                        finalBranchName, defaultApplicationId, applicationPermission.getEditPermission())
                .cache();

        Mono<Boolean> featureEnabledMono =
                featureFlagService.check(FeatureFlagEnum.release_git_autocommit_feature_enabled);
        Mono<Boolean> autoCommitDisabledForThisBranchMono = applicationMono.flatMap(application -> {
            if (GitUtils.isAutoCommitEnabled(application.getGitApplicationMetadata())) {
                return gitPrivateRepoHelper.isBranchProtected(application.getGitApplicationMetadata(), branchName);
            } else {
                return Mono.just(Boolean.TRUE);
            }
        });
        Mono<Boolean> isAutoCommitRunningMono = redisUtils
                .getRunningAutoCommitBranchName(defaultApplicationId)
                .map(a -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE));

        return isAutoCommitRunningMono
                .flatMap(isRunning -> {
                    if (isRunning) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    return Mono.zip(featureEnabledMono, autoCommitDisabledForThisBranchMono)
                            .flatMap(tuple -> {
                                Boolean isFeatureEnabled = tuple.getT1();
                                Boolean isAutoCommitDisabledForBranch = tuple.getT2();
                                if (isFeatureEnabled && !isAutoCommitDisabledForBranch) {
                                    return Mono.zip(applicationMono, branchedApplicationMono);
                                }

                                log.debug(
                                        "auto commit is not applicable for application: {} branch: {} isFeatureEnabled: {}, isAutoCommitDisabledForBranch: {}",
                                        defaultApplicationId,
                                        branchName,
                                        isFeatureEnabled,
                                        isAutoCommitDisabledForBranch);
                                return Mono.empty();
                            })
                            .flatMap(tuple2 -> {
                                Application defaultApplication = tuple2.getT1();
                                Application branchedApplication = tuple2.getT2();
                                return commonGitService
                                        .fetchRemoteChanges(defaultApplication, branchedApplication, branchName, true)
                                        .flatMap(branchTrackingStatus -> {
                                            if (branchTrackingStatus.getBehindCount() > 0) {
                                                log.debug(
                                                        "the remote is ahead of the local, aborting autocommit for application {} and branch {}",
                                                        defaultApplicationId,
                                                        branchName);
                                                return Mono.empty();
                                            }

                                            return Mono.just(defaultApplication);
                                        });
                            })
                            .zipWith(userDataService.getGitProfileForCurrentUser(defaultApplicationId))
                            .map(objects -> {
                                Application application = objects.getT1();
                                GitProfile gitProfile = objects.getT2();
                                GitArtifactMetadata gitArtifactMetadata = application.getGitApplicationMetadata();

                                AutoCommitEvent autoCommitEvent = new AutoCommitEvent(
                                        defaultApplicationId,
                                        branchName,
                                        application.getWorkspaceId(),
                                        gitArtifactMetadata.getRepoName(),
                                        gitProfile.getAuthorName(),
                                        gitProfile.getAuthorEmail(),
                                        gitArtifactMetadata.getRemoteUrl(),
                                        gitArtifactMetadata.getGitAuth().getPrivateKey(),
                                        gitArtifactMetadata.getGitAuth().getPublicKey());
                                // it's a synchronous call, no need to return anything
                                autoCommitEventHandler.publish(autoCommitEvent);
                                return Boolean.TRUE;
                            });
                })
                .defaultIfEmpty(Boolean.FALSE)
                // we cannot throw exception from this flow because doing so will fail the main operation
                .onErrorResume(throwable -> {
                    log.error(
                            "Error during auto-commit for application: {}, branch: {}",
                            defaultApplicationId,
                            branchName,
                            throwable);
                    return Mono.just(Boolean.FALSE);
                });
    }
}
