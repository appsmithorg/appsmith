package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.retry.Retry;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.constants.GitConstants.PAGE_LIST;
import static com.appsmith.server.helpers.GitUtils.MAX_RETRIES;
import static com.appsmith.server.helpers.GitUtils.RETRY_DELAY;

@RequiredArgsConstructor
@Slf4j
public class AutoCommitEventHandlerCEImpl implements AutoCommitEventHandlerCE {
    private final ApplicationEventPublisher applicationEventPublisher;
    private final RedisUtils redisUtils;
    private final DSLMigrationUtils dslMigrationUtils;
    private final GitFileUtils fileUtils;
    private final GitExecutor gitExecutor;
    private final ProjectProperties projectProperties;
    private final AnalyticsService analyticsService;

    public static final String AUTO_COMMIT_MSG_FORMAT =
            "System generated commit, to support new features after upgrading Appsmith to the version: %s";

    @Override
    public void publish(AutoCommitEvent autoCommitEvent) {
        applicationEventPublisher.publishEvent(autoCommitEvent);
        log.info("published event for auto commit: {}", autoCommitEvent);
    }

    @Async
    @EventListener
    @Override
    public void handle(AutoCommitEvent event) {
        log.info("received event for auto commit: {}", event);
        this.autoCommitDSLMigration(event)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> log.info(
                                "Auto-commit completed successfully for application: {}", event.getApplicationId()),
                        error -> log.error(
                                "Error during auto-commit for application: {}", event.getApplicationId(), error));
    }

    private Mono<Boolean> addFileLock(String defaultApplicationId) {
        return redisUtils
                .addFileLock(defaultApplicationId)
                .retryWhen(Retry.fixedDelay(MAX_RETRIES, RETRY_DELAY)
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> {
                            throw new AppsmithException(AppsmithError.GIT_FILE_IN_USE);
                        }));
    }

    private Mono<Boolean> releaseFileLock(String defaultApplicationId) {
        return redisUtils.releaseFileLock(defaultApplicationId);
    }

    private <T> Mono<T> setProgress(T result, String applicationId, int progress) {
        return redisUtils.setAutoCommitProgress(applicationId, progress).thenReturn(result);
    }

    private Mono<Boolean> resetUncommittedChanges(AutoCommitEvent autoCommitEvent) {
        Path baseRepoSuffix = Paths.get(
                autoCommitEvent.getWorkspaceId(), autoCommitEvent.getApplicationId(), autoCommitEvent.getRepoName());
        try {
            return gitExecutor.resetToLastCommit(baseRepoSuffix, autoCommitEvent.getBranchName());
        } catch (Exception e) {
            log.error(
                    "failed to reset to last commit before auto commit. application {} branch {}",
                    autoCommitEvent.getApplicationId(),
                    autoCommitEvent.getBranchName(),
                    e);
            return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "reset", e.getMessage()));
        }
    }

    private Mono<Path> saveApplicationJsonToFileSystem(
            ApplicationJson applicationJson, AutoCommitEvent autoCommitEvent) {
        // all the migrations are done, write to file system
        try {
            return fileUtils.saveApplicationToLocalRepo(
                    autoCommitEvent.getWorkspaceId(),
                    autoCommitEvent.getApplicationId(),
                    autoCommitEvent.getRepoName(),
                    applicationJson,
                    autoCommitEvent.getBranchName());
        } catch (Exception e) {
            log.error("failed to save application to file system using", e);
            return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
        }
    }

    public Mono<Boolean> autoCommitDSLMigration(AutoCommitEvent autoCommitEvent) {
        return addFileLock(autoCommitEvent.getApplicationId())
                .flatMap(fileLocked ->
                        redisUtils.startAutoCommit(autoCommitEvent.getApplicationId(), autoCommitEvent.getBranchName()))
                .flatMap(autoCommitLocked -> dslMigrationUtils.getLatestDslVersion())
                .flatMap(latestSchemaVersion -> resetUncommittedChanges(autoCommitEvent)
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 10))
                        .then(fileUtils.reconstructApplicationJsonFromGitRepo(
                                autoCommitEvent.getWorkspaceId(),
                                autoCommitEvent.getApplicationId(),
                                autoCommitEvent.getRepoName(),
                                autoCommitEvent.getBranchName()))
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 30))
                        .flatMap(applicationJson ->
                                migrateUnpublishedPageDSLs(applicationJson, latestSchemaVersion, autoCommitEvent))
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 50))
                        .flatMap(applicationJson -> saveApplicationJsonToFileSystem(applicationJson, autoCommitEvent))
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 70))
                        .flatMap(baseRepoPath -> {
                            // commit the application
                            return gitExecutor
                                    .commitApplication(
                                            baseRepoPath,
                                            String.format(AUTO_COMMIT_MSG_FORMAT, projectProperties.getVersion()),
                                            autoCommitEvent.getAuthorName(),
                                            autoCommitEvent.getAuthorEmail(),
                                            false,
                                            false)
                                    .map(commitResponse -> Boolean.TRUE);
                        })
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 80))
                        .flatMap(result -> {
                            Path baseRepoSuffix = Paths.get(
                                    autoCommitEvent.getWorkspaceId(),
                                    autoCommitEvent.getApplicationId(),
                                    autoCommitEvent.getRepoName());

                            return gitExecutor
                                    .pushApplication(
                                            baseRepoSuffix,
                                            autoCommitEvent.getRepoUrl(),
                                            autoCommitEvent.getPublicKey(),
                                            autoCommitEvent.getPrivateKey(),
                                            autoCommitEvent.getBranchName())
                                    .map(pushResponse -> Boolean.TRUE);
                        })
                        .defaultIfEmpty(Boolean.FALSE))
                .flatMap(result -> {
                    log.info(
                            "auto commit finished. added commit: {}, application: {}, branch: {}",
                            result,
                            autoCommitEvent.getApplicationId(),
                            autoCommitEvent.getBranchName());
                    return cleanUp(autoCommitEvent, result, false);
                })
                .onErrorResume(throwable -> {
                    log.error(
                            "Failed to auto-commit application: {} branch {}",
                            autoCommitEvent.getApplicationId(),
                            autoCommitEvent.getBranchName(),
                            throwable);
                    return cleanUp(autoCommitEvent, Boolean.FALSE, true);
                });
    }

    private Mono<Boolean> cleanUp(AutoCommitEvent autoCommitEvent, boolean isCommitMade, boolean exceptionCaught) {
        return redisUtils
                .finishAutoCommit(autoCommitEvent.getApplicationId())
                .flatMap(r -> setProgress(r, autoCommitEvent.getApplicationId(), 100))
                .flatMap(r -> releaseFileLock(autoCommitEvent.getApplicationId()))
                .then(triggerAnalyticsEvent(autoCommitEvent, isCommitMade))
                .thenReturn(isCommitMade);
    }

    private Mono<Boolean> triggerAnalyticsEvent(AutoCommitEvent autoCommitEvent, boolean isCommitted) {
        if (isCommitted) {
            Map<String, Object> analyticsProps = new HashMap<>();
            analyticsProps.put("appId", autoCommitEvent.getApplicationId());
            analyticsProps.put(FieldName.BRANCH_NAME, autoCommitEvent.getBranchName());
            analyticsProps.put("orgId", autoCommitEvent.getWorkspaceId());
            analyticsProps.put("isSystemGenerated", true);
            analyticsProps.put("isAutoCommit", true);
            analyticsProps.put("repoUrl", autoCommitEvent.getRepoUrl());

            return analyticsService
                    .sendEvent(
                            AnalyticsEvents.GIT_COMMIT.getEventName(),
                            autoCommitEvent.getAuthorEmail(),
                            analyticsProps,
                            Boolean.TRUE)
                    .thenReturn(Boolean.TRUE);
        } else {
            return Mono.just(Boolean.FALSE);
        }
    }

    /**
     * This method is responsible for migrating all the page DSLs from RTS, update the application json and
     * return the updated application json. However, it'll return an empty Mono for the following cases:
     * 1. If the page list is empty in the application json
     * 2. If there is no page with older DSL version
     * @param applicationJson ApplicationJson object
     * @param latestSchemaVersion latest version of the schema
     * @param autoCommitEvent AutoCommitEvent object
     * @return updated application json
     */
    private Mono<ApplicationJson> migrateUnpublishedPageDSLs(
            ApplicationJson applicationJson, Integer latestSchemaVersion, AutoCommitEvent autoCommitEvent) {
        if (!CollectionUtils.isNullOrEmpty(applicationJson.getPageList())) {
            return migratePageDsl(applicationJson.getPageList(), latestSchemaVersion)
                    // if no page is updated then no need to proceed further
                    .filter(list -> {
                        if (CollectionUtils.isNullOrEmpty(list)) {
                            log.info("No page is migrated, skipping auto commit");
                            return false;
                        } else {
                            log.info("{} pages migrated, proceeding auto commit", list.size());
                            return true;
                        }
                    })
                    .map(updatedPageNamesList -> {
                        log.info("{} pages migrated and will be added to auto commit", updatedPageNamesList.size());
                        /*
                         Need to set the page names in the updated resources because the
                         ApplicationJson to file system conversion will use this field to decide
                         which pages need to be written back to file system.
                        */
                        Set<String> pageNamesSet = new HashSet<>(updatedPageNamesList);
                        Map<String, Set<String>> updatedResources = new HashMap<>();
                        updatedResources.put(PAGE_LIST, pageNamesSet);
                        applicationJson.setUpdatedResources(updatedResources);
                        return applicationJson;
                    });
        } else {
            log.info(
                    "empty list of pages found in auto commit. application {}, branch {}",
                    autoCommitEvent.getApplicationId(),
                    autoCommitEvent.getBranchName());
            return Mono.empty();
        }
    }

    /**
     * This method takes a list of NewPage and latest dsl schema version. It'll iterate through the list of the pages
     * and migrate the page dsl if the version in the page dsl is older than latestSchemaVersion.
     * After finishing all the migrations, it'll return a list of page names that have been updated.
     * @param newPageList list of NewPage objects
     * @param latestSchemaVersion latest dsl schema version obtained from RTS
     * @return list of names of the pages that have been migrated.
     */
    private Mono<List<String>> migratePageDsl(List<NewPage> newPageList, Integer latestSchemaVersion) {
        return Flux.fromIterable(newPageList)
                .filter(newPage -> {
                    // filter the pages which have unpublished page with layouts and where dsl version is not latest
                    if (newPage.getUnpublishedPage() != null
                            && !CollectionUtils.isNullOrEmpty(
                                    newPage.getUnpublishedPage().getLayouts())) {
                        Layout layout =
                                newPage.getUnpublishedPage().getLayouts().get(0);
                        return GitUtils.isMigrationRequired(layout.getDsl(), latestSchemaVersion);
                    }
                    return false;
                })
                .map(NewPage::getUnpublishedPage)
                .flatMap(pageDTO -> {
                    Layout layout = pageDTO.getLayouts().get(0);
                    return dslMigrationUtils
                            .migratePageDsl(layout.getDsl())
                            .map(migratedDsl -> {
                                layout.setDsl(migratedDsl);
                                return migratedDsl;
                            })
                            .thenReturn(pageDTO.getName());
                })
                .collectList();
    }
}
