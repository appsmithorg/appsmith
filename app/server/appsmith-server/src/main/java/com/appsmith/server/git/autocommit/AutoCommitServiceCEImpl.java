package com.appsmith.server.git.autocommit;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.autocommit.helpers.AutoCommitEligibilityHelper;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelperImpl;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.Set;

import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.IDLE;
import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.IN_PROGRESS;
import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.LOCKED;
import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.NON_GIT_APP;
import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.PUBLISHED;
import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.REQUIRED;
import static java.lang.Boolean.TRUE;
import static org.springframework.util.StringUtils.hasText;

@Slf4j
@RequiredArgsConstructor
public class AutoCommitServiceCEImpl implements AutoCommitServiceCE {

    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;

    private final NewPageService newPageService;
    private final PagePermission pagePermission;

    private final AutoCommitEligibilityHelper autoCommitEligibilityHelper;
    private final GitAutoCommitHelperImpl gitAutoCommitHelper;

    @Override
    public Mono<AutoCommitResponseDTO> autoCommitApplication(String branchedApplicationId) {

        if (!hasText(branchedApplicationId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        Mono<Application> applicationMonoCached = applicationService
                .findById(branchedApplicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId)))
                .cache();

        // A page-dto which must exist in the git file system is required,
        // this existence can be guaranteed by using application mode = published
        // in appsmith git system an application could be only published if it's commited, converse is also true,
        // hence a published page would definitely be present in git fs.
        Mono<PageDTO> pageDTOMono = applicationMonoCached
                .flatMap(application -> newPageService
                        .findByApplicationIdAndApplicationMode(
                                application.getId(), pagePermission.getEditPermission(), ApplicationMode.PUBLISHED)
                        .next())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, branchedApplicationId)));

        return applicationMonoCached.zipWith(pageDTOMono).flatMap(tuple2 -> {
            Application branchedApplication = tuple2.getT1();
            PageDTO pageDTO = tuple2.getT2();

            AutoCommitResponseDTO autoCommitResponseDTO = new AutoCommitResponseDTO();

            if (branchedApplication.getGitApplicationMetadata() == null) {
                autoCommitResponseDTO.setAutoCommitResponse(NON_GIT_APP);
                return Mono.just(autoCommitResponseDTO);
            }

            String workspaceId = branchedApplication.getWorkspaceId();
            GitArtifactMetadata branchedGitMetadata = branchedApplication.getGitArtifactMetadata();
            final String baseApplicationId = branchedGitMetadata.getDefaultArtifactId();
            final String branchName = branchedGitMetadata.getBranchName();

            if (!hasText(branchName)) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
            }

            Mono<AutoCommitTriggerDTO> isAutoCommitRequiredMono =
                    autoCommitEligibilityHelper.isAutoCommitRequired(workspaceId, branchedGitMetadata, pageDTO);

            Mono<AutoCommitResponseDTO> autoCommitProgressDTOMono =
                    gitAutoCommitHelper.getAutoCommitProgress(baseApplicationId, branchName);

            return autoCommitProgressDTOMono.flatMap(autoCommitProgressDTO -> {
                if (Set.of(LOCKED, IN_PROGRESS).contains(autoCommitProgressDTO.getAutoCommitResponse())) {
                    log.info(
                            "application with id: {}, has requested auto-commit for branch name: {}, however an event for branch name: {} is already in progress",
                            baseApplicationId,
                            branchName,
                            autoCommitProgressDTO.getBranchName());
                    autoCommitResponseDTO.setAutoCommitResponse(autoCommitProgressDTO.getAutoCommitResponse());
                    autoCommitResponseDTO.setProgress(autoCommitProgressDTO.getProgress());
                    autoCommitResponseDTO.setBranchName(autoCommitProgressDTO.getBranchName());
                    return Mono.just(autoCommitResponseDTO);
                }

                return isAutoCommitRequiredMono.flatMap(autoCommitTriggerDTO -> {
                    if (!Boolean.TRUE.equals(autoCommitTriggerDTO.getIsAutoCommitRequired())) {
                        log.info(
                                "application with id: {}, and branch name: {} is not eligible for autocommit",
                                baseApplicationId,
                                branchName);
                        autoCommitResponseDTO.setAutoCommitResponse(IDLE);
                        return Mono.just(autoCommitResponseDTO);
                    }

                    // Autocommit can be started
                    log.info(
                            "application with id: {}, and branch name: {} is eligible for autocommit",
                            baseApplicationId,
                            branchName);
                    return gitAutoCommitHelper
                            .publishAutoCommitEvent(autoCommitTriggerDTO, baseApplicationId, branchName)
                            .map(isEventPublished -> {
                                if (TRUE.equals(isEventPublished)) {
                                    log.info(
                                            "autocommit event for application with id: {}, and branch name: {} is published",
                                            baseApplicationId,
                                            branchName);
                                    autoCommitResponseDTO.setAutoCommitResponse(PUBLISHED);
                                    return autoCommitResponseDTO;
                                }

                                log.info(
                                        "application with id: {}, and branch name: {} does not fulfil the prerequisite for autocommit",
                                        baseApplicationId,
                                        branchName);
                                autoCommitResponseDTO.setAutoCommitResponse(REQUIRED);
                                return autoCommitResponseDTO;
                            });
                });
            });
        });
    }
}
