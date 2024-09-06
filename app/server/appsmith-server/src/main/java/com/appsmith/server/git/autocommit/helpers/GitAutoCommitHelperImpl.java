package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.external.annotations.FeatureFlagged;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.git.autocommit.AutoCommitEventHandler;
import com.appsmith.server.git.common.CommonGitService;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.IDLE;
import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.IN_PROGRESS;
import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.LOCKED;

@Slf4j
@Primary
@Service
public class GitAutoCommitHelperImpl extends GitAutoCommitHelperFallbackImpl implements GitAutoCommitHelper {
    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final AutoCommitEventHandler autoCommitEventHandler;
    private final UserDataService userDataService;
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final RedisUtils redisUtils;
    private final CommonGitService commonGitService;

    public GitAutoCommitHelperImpl(
            GitPrivateRepoHelper gitPrivateRepoHelper,
            AutoCommitEventHandler autoCommitEventHandler,
            UserDataService userDataService,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            RedisUtils redisUtils,
            @Lazy CommonGitService commonGitService) {
        this.gitPrivateRepoHelper = gitPrivateRepoHelper;
        this.autoCommitEventHandler = autoCommitEventHandler;
        this.userDataService = userDataService;
        this.applicationService = applicationService;
        this.applicationPermission = applicationPermission;
        this.redisUtils = redisUtils;
        this.commonGitService = commonGitService;
    }

    @Override
    public Mono<AutoCommitResponseDTO> getAutoCommitProgress(String defaultApplicationId, String branchName) {
        return redisUtils
                .getRunningAutoCommitBranchName(defaultApplicationId)
                .zipWith(redisUtils.getAutoCommitProgress(defaultApplicationId))
                .map(tuple2 -> {
                    String branchNameFromRedis = tuple2.getT1();

                    AutoCommitResponseDTO autoCommitResponseDTO = new AutoCommitResponseDTO();
                    autoCommitResponseDTO.setProgress(tuple2.getT2());
                    autoCommitResponseDTO.setBranchName(branchNameFromRedis);

                    if (branchNameFromRedis.equals(branchName)) {
                        autoCommitResponseDTO.setAutoCommitResponse(IN_PROGRESS);
                    } else {
                        autoCommitResponseDTO.setAutoCommitResponse(LOCKED);
                    }

                    return autoCommitResponseDTO;
                })
                .defaultIfEmpty(new AutoCommitResponseDTO(IDLE));
    }

    /**
     * This method finds if the application could be processed for autocommit.
     * @param defaultApplication: the default application for the git
     * @param branchName: branch name
     * @return a flag denoting whether the application is good to be committed.
     */
    private Mono<Boolean> isAutoCommitAllowed(Application defaultApplication, String branchName) {
        String defaultApplicationId = defaultApplication.getId();

        if (!GitUtils.isAutoCommitEnabled(defaultApplication.getGitApplicationMetadata())) {
            log.info("Auto commit is disabled for application: {}", defaultApplicationId);
            return Mono.just(Boolean.FALSE);
        }

        Mono<Boolean> isBranchProtectedMono =
                gitPrivateRepoHelper.isBranchProtected(defaultApplication.getGitApplicationMetadata(), branchName);

        Mono<Boolean> isAutoCommitRunningMono = redisUtils
                .getRunningAutoCommitBranchName(defaultApplicationId)
                .map(a -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE));

        return Mono.zip(isBranchProtectedMono, isAutoCommitRunningMono)
                .flatMap(tuple -> {
                    Boolean isBranchProtected = tuple.getT1();
                    Boolean isAutoCommitRunning = tuple.getT2();

                    if (isBranchProtected || isAutoCommitRunning) {
                        log.info(
                                "Auto commit is not applicable for application: {} branch: {}, isAutoCommitDisabledForBranch: {}",
                                defaultApplicationId,
                                branchName,
                                isBranchProtected);
                        return Mono.just(Boolean.FALSE);
                    }

                    log.info(
                            "Auto commit for application: {} branch: {} is applicable",
                            defaultApplicationId,
                            branchName);

                    return Mono.just(Boolean.TRUE);
                })
                .switchIfEmpty(Mono.just(Boolean.FALSE));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
    public Mono<Boolean> autoCommitClientMigration(String defaultApplicationId, String branchName) {
        return autoCommitApplication(defaultApplicationId, branchName, Boolean.TRUE);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
    public Mono<Boolean> autoCommitServerMigration(String defaultApplicationId, String branchName) {
        return autoCommitApplication(defaultApplicationId, branchName, Boolean.FALSE);
    }

    public Mono<Boolean> autoCommitApplication(
            String defaultApplicationId, String branchName, Boolean isClientMigration) {

        log.info("Auto commit for application {} and branch {} in the publish flow", defaultApplicationId, branchName);

        // if either param is absent, then application is not connected to git.
        if (!StringUtils.hasText(branchName) || !StringUtils.hasText(defaultApplicationId)) {
            return Mono.just(Boolean.FALSE);
        }

        final String finalBranchName = branchName.replaceFirst("origin/", "");

        Mono<Application> applicationMono = applicationService
                .findById(defaultApplicationId, applicationPermission.getEditPermission())
                .cache();

        Mono<Application> branchedApplicationMono = applicationService
                .findByBranchNameAndBaseApplicationId(
                        finalBranchName, defaultApplicationId, applicationPermission.getEditPermission())
                .cache();

        return applicationMono
                .flatMap(defaultApplication -> {
                    return isAutoCommitAllowed(defaultApplication, finalBranchName)
                            .flatMap(isEligible -> {
                                log.info(
                                        "Auto commit for application {}, and branch name {} is not allowed.",
                                        defaultApplication.getId(),
                                        branchName);
                                if (!Boolean.TRUE.equals(isEligible)) {
                                    return Mono.empty();
                                }

                                log.info(
                                        "Auto commit for application {}, and branch name {} is applicable",
                                        defaultApplication.getId(),
                                        branchName);
                                return Mono.zip(applicationMono, branchedApplicationMono);
                            });
                })
                .flatMap(tuple2 -> {
                    Application defaultApplication = tuple2.getT1();
                    Application branchedApplication = tuple2.getT2();
                    log.info(
                            "Auto commit for application {}, and branch name {} is fetching remote changes",
                            defaultApplication.getId(),
                            branchName);
                    return commonGitService
                            .fetchRemoteChanges(defaultApplication, branchedApplication, true)
                            .flatMap(branchTrackingStatus -> {
                                if (branchTrackingStatus.getBehindCount() > 0) {
                                    log.info(
                                            "the remote is ahead of the local, aborting autocommit for application {} and branch {}",
                                            defaultApplicationId,
                                            branchName);
                                    return Mono.empty();
                                }
                                return Mono.just(defaultApplication)
                                        .zipWith(userDataService.getGitProfileForCurrentUser(defaultApplicationId));
                            });
                })
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

                    if (Boolean.TRUE.equals(isClientMigration)) {
                        autoCommitEvent.setIsClientSideEvent(Boolean.TRUE);
                    } else {
                        autoCommitEvent.setIsServerSideEvent(Boolean.TRUE);
                    }

                    // it's a synchronous call, no need to return anything
                    autoCommitEventHandler.publish(autoCommitEvent);
                    return Boolean.TRUE;
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

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_git_autocommit_feature_enabled)
    public Mono<Boolean> publishAutoCommitEvent(
            AutoCommitTriggerDTO autoCommitTriggerDTO, String defaultApplicationId, String branchName) {

        log.info("Trying to publish auto commit for application {} and branch {}", defaultApplicationId, branchName);

        if (!Boolean.TRUE.equals(autoCommitTriggerDTO.getIsAutoCommitRequired())) {
            return Mono.just(Boolean.FALSE);
        }

        // Since server autocommit is a subset of the client migration, hence if only the client migration
        // is true then we can only go ahead with client migration.
        if (Boolean.TRUE.equals(autoCommitTriggerDTO.getIsClientAutoCommitRequired())) {
            return autoCommitClientMigration(defaultApplicationId, branchName);
        }

        // at this point only server flag could be true.
        return autoCommitServerMigration(defaultApplicationId, branchName);
    }
}
