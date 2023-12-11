package com.appsmith.server.helpers.ce;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.AutoCommitProgressDTO;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.AutoCommitEventHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
@Service
public class GitAutoCommitHelperImpl implements GitAutoCommitHelper {
    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final AutoCommitEventHandler autoCommitEventHandler;
    private final UserDataService userDataService;
    private final FeatureFlagService featureFlagService;
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final RedisUtils redisUtils;

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
        Mono<Application> applicationMono = applicationService
                .findById(defaultApplicationId, applicationPermission.getEditPermission())
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

        if (StringUtils.hasLength(defaultApplicationId) && StringUtils.hasLength(branchName)) {
            // both of them are present, so it's a git connected application
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
                                        return applicationMono;
                                    } else {
                                        log.debug(
                                                "auto commit is not applicable for application: {} branch: {} isFeatureEnabled: {}, isAutoCommitDisabledForBranch: {}",
                                                defaultApplicationId,
                                                branchName,
                                                isFeatureEnabled,
                                                isAutoCommitDisabledForBranch);
                                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                                    }
                                })
                                .zipWith(userDataService.getGitProfileForCurrentUser(defaultApplicationId))
                                .map(objects -> {
                                    Application application = objects.getT1();
                                    GitProfile gitProfile = objects.getT2();
                                    GitApplicationMetadata gitApplicationMetadata =
                                            application.getGitApplicationMetadata();

                                    AutoCommitEvent autoCommitEvent = new AutoCommitEvent();
                                    autoCommitEvent.setApplicationId(defaultApplicationId);
                                    autoCommitEvent.setBranchName(branchName);
                                    autoCommitEvent.setRepoName(gitApplicationMetadata.getRepoName());
                                    autoCommitEvent.setWorkspaceId(application.getWorkspaceId());
                                    autoCommitEvent.setAuthorName(gitProfile.getAuthorName());
                                    autoCommitEvent.setAuthorEmail(gitProfile.getAuthorEmail());
                                    // it's a synchronous call, no need to return anything
                                    autoCommitEventHandler.publish(autoCommitEvent);
                                    return Boolean.TRUE;
                                });
                    })
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
        return Mono.just(Boolean.FALSE);
    }
}
