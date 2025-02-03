package com.appsmith.server.git.autocommit;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.constants.GitConstants.GitCommandConstants;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
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
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.git.constants.GitConstants.PAGE_LIST;
import static java.lang.Boolean.TRUE;

@RequiredArgsConstructor
@Slf4j
public class AutoCommitEventHandlerCEImpl implements AutoCommitEventHandlerCE {
    private final ApplicationEventPublisher applicationEventPublisher;
    private final GitRedisUtils gitRedisUtils;
    private final RedisUtils redisUtils;
    private final DSLMigrationUtils dslMigrationUtils;
    private final CommonGitFileUtils commonGitFileUtils;
    private final GitExecutor gitExecutor;
    private final ProjectProperties projectProperties;
    private final AnalyticsService analyticsService;

    public static final String AUTO_COMMIT_MSG_FORMAT =
            "System generated commit, to support new features in Appsmith %s";

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
        Mono<Boolean> autocommitMigration;
        if (Boolean.TRUE.equals(event.getIsServerSideEvent())) {
            autocommitMigration = this.autoCommitServerMigration(event);
        } else {
            autocommitMigration = this.autoCommitDSLMigration(event);
        }

        autocommitMigration
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> log.info(
                                "Auto-commit completed successfully for application: {}", event.getApplicationId()),
                        error -> log.error(
                                "Error during auto-commit for application: {}", event.getApplicationId(), error));
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
            return commonGitFileUtils.saveArtifactToLocalRepo(
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
        return gitRedisUtils
                .addFileLock(autoCommitEvent.getApplicationId(), GitCommandConstants.AUTO_COMMIT)
                .flatMap(fileLocked ->
                        redisUtils.startAutoCommit(autoCommitEvent.getApplicationId(), autoCommitEvent.getBranchName()))
                .flatMap(autoCommitLocked -> dslMigrationUtils.getLatestDslVersion())
                .flatMap(latestSchemaVersion -> resetUncommittedChanges(autoCommitEvent)
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 10))
                        .then(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepo(
                                autoCommitEvent.getWorkspaceId(),
                                autoCommitEvent.getApplicationId(),
                                autoCommitEvent.getRepoName(),
                                autoCommitEvent.getBranchName(),
                                ArtifactType.APPLICATION))
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 30))
                        .flatMap(applicationJson -> migrateUnpublishedPageDSLs(
                                (ApplicationJson) applicationJson, latestSchemaVersion, autoCommitEvent))
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 50))
                        .flatMap(applicationJson -> saveApplicationJsonToFileSystem(applicationJson, autoCommitEvent))
                        .flatMap(result -> setProgress(result, autoCommitEvent.getApplicationId(), 70))
                        .flatMap(baseRepoPath -> commitAndPush(autoCommitEvent, baseRepoPath))
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
                .flatMap(r -> gitRedisUtils.releaseFileLock(autoCommitEvent.getApplicationId()))
                .thenReturn(isCommitMade);
    }

    private Mono<Boolean> triggerAnalyticsEvent(
            AnalyticsEvents analyticsEvent, AutoCommitEvent autoCommitEvent, Map<String, Object> attributes) {
        Map<String, Object> analyticsProps = new HashMap<>();
        analyticsProps.put("appId", autoCommitEvent.getApplicationId());
        analyticsProps.put(FieldName.BRANCH_NAME, autoCommitEvent.getBranchName());
        analyticsProps.put("workspaceId", autoCommitEvent.getWorkspaceId());
        analyticsProps.put("isSystemGenerated", true);
        analyticsProps.put("repoUrl", autoCommitEvent.getRepoUrl());

        analyticsProps.putAll(attributes);

        return analyticsService
                .sendEvent(analyticsEvent.getEventName(), autoCommitEvent.getAuthorEmail(), analyticsProps, TRUE)
                .thenReturn(TRUE);
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

                        Set<String> pageNamesSet =
                                updatedPageNamesList.stream().map(Tuple2::getT1).collect(Collectors.toSet());
                        Set<String> pageIdentifiersSet =
                                updatedPageNamesList.stream().map(Tuple2::getT2).collect(Collectors.toSet());
                        ModifiedResources modifiedResources = new ModifiedResources();
                        modifiedResources.putResource(PAGE_LIST, pageNamesSet);
                        modifiedResources
                                .getModifiedResourceIdentifiers()
                                .get(GitResourceType.CONTEXT_CONFIG)
                                .addAll(pageIdentifiersSet);
                        modifiedResources.setAllModified(true);
                        applicationJson.setModifiedResources(modifiedResources);
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
    private Mono<List<Tuple2<String, String>>> migratePageDsl(List<NewPage> newPageList, Integer latestSchemaVersion) {
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
                .flatMap(newPage -> {
                    PageDTO pageDTO = newPage.getUnpublishedPage();
                    Layout layout = pageDTO.getLayouts().get(0);
                    return dslMigrationUtils
                            .migratePageDsl(layout.getDsl())
                            .map(migratedDsl -> {
                                layout.setDsl(migratedDsl);
                                return migratedDsl;
                            })
                            .thenReturn(Tuples.of(pageDTO.getName(), newPage.getGitSyncId()));
                })
                .collectList();
    }

    /**
     * Event for initiating server side autocommit.
     * @param autoCommitEvent: event for server side autocommit
     * @return
     */
    @Override
    public Mono<Boolean> autoCommitServerMigration(AutoCommitEvent autoCommitEvent) {

        String defaultApplicationId = autoCommitEvent.getApplicationId();
        String branchName = autoCommitEvent.getBranchName();
        String workspaceId = autoCommitEvent.getWorkspaceId();
        String repoName = autoCommitEvent.getRepoName();

        // add file lock
        // reset the file_system. while resetting the branch is implicitly checked out.
        // retrieve and create application json from the file system
        // write it in the application json
        // commit application
        // push to remote
        // release file lock

        return gitRedisUtils
                .addFileLock(defaultApplicationId, GitCommandConstants.AUTO_COMMIT)
                .flatMap(isFileLocked -> redisUtils.startAutoCommit(defaultApplicationId, branchName))
                .flatMap(r -> setProgress(r, defaultApplicationId, 10))
                .flatMap(autoCommitLocked -> resetUncommittedChanges(autoCommitEvent))
                .flatMap(r -> setProgress(r, defaultApplicationId, 20))
                .flatMap(isBranchCheckedOut -> commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepo(
                        workspaceId, defaultApplicationId, repoName, branchName, ArtifactType.APPLICATION))
                .flatMap(r -> setProgress(r, defaultApplicationId, 30))
                .flatMap(applicationJson -> {
                    ModifiedResources modifiedResources = new ModifiedResources();
                    // setting all modified would help in serialisation of all the files, unoptimised
                    modifiedResources.setAllModified(true);
                    applicationJson.setModifiedResources(modifiedResources);
                    return saveApplicationJsonToFileSystem((ApplicationJson) applicationJson, autoCommitEvent);
                })
                .flatMap(r -> setProgress(r, defaultApplicationId, 50))
                .flatMap(baseRepoPath -> commitAndPush(autoCommitEvent, baseRepoPath))
                .defaultIfEmpty(Boolean.FALSE)
                .flatMap(result -> {
                    log.info(
                            "server side auto commit finished. added commit: {}, application: {}, branch: {}",
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

    protected Mono<Boolean> commitAndPush(AutoCommitEvent autoCommitEvent, Path baseRepoPath) {
        // commit the application
        return gitExecutor
                .commitArtifact(
                        baseRepoPath,
                        String.format(AUTO_COMMIT_MSG_FORMAT, projectProperties.getVersion()),
                        autoCommitEvent.getAuthorName(),
                        autoCommitEvent.getAuthorEmail(),
                        false,
                        false)
                .then(triggerAnalyticsEvent(AnalyticsEvents.GIT_COMMIT, autoCommitEvent, Map.of("isAutoCommit", TRUE)))
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
                            .flatMap(pushResponse -> {
                                if (!pushResponse.contains("REJECTED")) { // push was successful
                                    return triggerAnalyticsEvent(
                                            AnalyticsEvents.GIT_PUSH, autoCommitEvent, Map.of("isAutoCommit", TRUE));
                                }
                                return Mono.just(TRUE);
                            });
                })
                .defaultIfEmpty(Boolean.FALSE);
    }
}
