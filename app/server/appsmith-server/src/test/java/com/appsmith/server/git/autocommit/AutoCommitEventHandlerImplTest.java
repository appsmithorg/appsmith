package com.appsmith.server.git.autocommit;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.AutoCommitEventHandler;
import com.appsmith.server.solutions.AutoCommitEventHandlerImpl;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static com.appsmith.server.solutions.ce.AutoCommitEventHandlerCEImpl.AUTO_COMMIT_MSG_FORMAT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class AutoCommitEventHandlerImplTest {
    @MockBean
    ApplicationEventPublisher applicationEventPublisher;

    @SpyBean
    RedisUtils redisUtils;

    @Autowired
    AnalyticsService analyticsService;

    @MockBean
    DSLMigrationUtils dslMigrationUtils;

    @MockBean
    GitFileUtils fileUtils;

    @MockBean
    GitExecutor gitExecutor;

    @Autowired
    ProjectProperties projectProperties;

    AutoCommitEventHandler autoCommitEventHandler;

    private static final String defaultApplicationId = "default-app-id", branchName = "develop";

    @BeforeEach
    public void beforeTest() {
        autoCommitEventHandler = new AutoCommitEventHandlerImpl(
                applicationEventPublisher,
                redisUtils,
                dslMigrationUtils,
                fileUtils,
                gitExecutor,
                projectProperties,
                analyticsService);
    }

    @AfterEach
    public void afterTest() {
        redisUtils.finishAutoCommit(defaultApplicationId).block();
        redisUtils.releaseFileLock(defaultApplicationId).block();
    }

    @Test
    public void autoCommitDSLMigration_WhenAutoCommitAlreadyStarted_ReturnsFalse() {
        AutoCommitEvent autoCommitEvent = new AutoCommitEvent();
        autoCommitEvent.setApplicationId(defaultApplicationId);
        autoCommitEvent.setBranchName(branchName);

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(10));

        //        Mockito.when(analyticsService.sendEvent(anyString(), anyString(), anyMap(), anyBoolean()))
        //            .thenReturn(Mono.empty());

        Mono<Boolean> map = redisUtils
                .startAutoCommit(defaultApplicationId, branchName)
                .then(autoCommitEventHandler.autoCommitDSLMigration(autoCommitEvent));

        StepVerifier.create(map)
                .assertNext(x -> {
                    assertThat(x).isFalse();
                })
                .verifyComplete();
    }

    private AutoCommitEvent createEvent() {
        AutoCommitEvent autoCommitEvent = new AutoCommitEvent();
        autoCommitEvent.setApplicationId(defaultApplicationId);
        autoCommitEvent.setBranchName(branchName);
        autoCommitEvent.setRepoName("test-repo");
        autoCommitEvent.setAuthorName("test author");
        autoCommitEvent.setAuthorEmail("testauthor@example.com");
        autoCommitEvent.setWorkspaceId("test-workspace-id");
        autoCommitEvent.setRepoUrl("git@example.com:exampleorg/example-repo.git");
        autoCommitEvent.setPrivateKey("private-key");
        autoCommitEvent.setPublicKey("public-key");
        return autoCommitEvent;
    }

    private ApplicationJson createApplicationJson() {
        JSONObject dsl = new JSONObject();
        dsl.put("key", "initial value");
        dsl.put("version", 20);

        Layout layout = new Layout();
        layout.setDsl(dsl);
        PageDTO pageDTO = new PageDTO();
        pageDTO.setName("Page 1");
        pageDTO.setLayouts(List.of(layout));
        NewPage newPage = new NewPage();
        newPage.setUnpublishedPage(pageDTO);
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setPageList(List.of(newPage));
        return applicationJson;
    }

    @Test
    public void autoCommitDSLMigration_WhenNoAutoCommitInProgress_AllStepsSuccessfullyCompleted()
            throws GitAPIException, IOException {
        AutoCommitEvent autoCommitEvent = createEvent();
        ApplicationJson applicationJson = createApplicationJson();

        JSONObject dslBeforeMigration = applicationJson
                .getPageList()
                .get(0)
                .getUnpublishedPage()
                .getLayouts()
                .get(0)
                .getDsl();

        int currentDslVersion = dslBeforeMigration.getAsNumber("version").intValue();
        JSONObject dslAfterMigration = new JSONObject();
        dslAfterMigration.put("key", "after migration");

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(currentDslVersion + 1));
        Path baseRepoSuffix = Paths.get(
                autoCommitEvent.getWorkspaceId(), autoCommitEvent.getApplicationId(), autoCommitEvent.getRepoName());

        Mockito.when(gitExecutor.resetToLastCommit(baseRepoSuffix, autoCommitEvent.getBranchName()))
                .thenReturn(Mono.just(Boolean.TRUE));

        Mockito.when(fileUtils.reconstructApplicationJsonFromGitRepo(
                        autoCommitEvent.getWorkspaceId(),
                        autoCommitEvent.getApplicationId(),
                        autoCommitEvent.getRepoName(),
                        autoCommitEvent.getBranchName()))
                .thenReturn(Mono.just(applicationJson));

        // mock the dsl migration utils to return updated dsl when requested with older dsl
        Mockito.when(dslMigrationUtils.migratePageDsl(any(JSONObject.class))).thenReturn(Mono.just(dslAfterMigration));

        Mockito.when(fileUtils.saveApplicationToLocalRepo(
                        autoCommitEvent.getWorkspaceId(),
                        autoCommitEvent.getApplicationId(),
                        autoCommitEvent.getRepoName(),
                        applicationJson,
                        autoCommitEvent.getBranchName()))
                .thenReturn(Mono.just(baseRepoSuffix));

        Mockito.when(gitExecutor.commitArtifact(
                        baseRepoSuffix,
                        String.format(AUTO_COMMIT_MSG_FORMAT, projectProperties.getVersion()),
                        autoCommitEvent.getAuthorName(),
                        autoCommitEvent.getAuthorEmail(),
                        false,
                        false))
                .thenReturn(Mono.just("success"));

        Mockito.when(gitExecutor.pushApplication(
                        baseRepoSuffix,
                        autoCommitEvent.getRepoUrl(),
                        autoCommitEvent.getPublicKey(),
                        autoCommitEvent.getPrivateKey(),
                        autoCommitEvent.getBranchName()))
                .thenReturn(Mono.just("success"));

        StepVerifier.create(autoCommitEventHandler
                        .autoCommitDSLMigration(autoCommitEvent)
                        .zipWhen(a -> redisUtils.getAutoCommitProgress(autoCommitEvent.getApplicationId())))
                .assertNext(tuple2 -> {
                    assertThat(tuple2.getT1()).isTrue();
                    assertThat(tuple2.getT2()).isEqualTo(100);
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitDSLMigration_WhenPageDslAlreadyLatest_NoCommitMade() throws GitAPIException, IOException {
        AutoCommitEvent autoCommitEvent = createEvent();
        ApplicationJson applicationJson = createApplicationJson();
        JSONObject dslBeforeMigration = applicationJson
                .getPageList()
                .get(0)
                .getUnpublishedPage()
                .getLayouts()
                .get(0)
                .getDsl();

        int currentDslVersion = dslBeforeMigration.getAsNumber("version").intValue();
        // mock so that rts returns current dsl version as latest dsl version
        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(currentDslVersion));
        Path baseRepoSuffix = Paths.get(
                autoCommitEvent.getWorkspaceId(), autoCommitEvent.getApplicationId(), autoCommitEvent.getRepoName());

        Mockito.when(gitExecutor.resetToLastCommit(baseRepoSuffix, autoCommitEvent.getBranchName()))
                .thenReturn(Mono.just(Boolean.TRUE));

        Mockito.when(fileUtils.reconstructApplicationJsonFromGitRepo(
                        autoCommitEvent.getWorkspaceId(),
                        autoCommitEvent.getApplicationId(),
                        autoCommitEvent.getRepoName(),
                        autoCommitEvent.getBranchName()))
                .thenReturn(Mono.just(applicationJson));

        // the rest of the process should not trigger as no migration is required
        StepVerifier.create(autoCommitEventHandler
                        .autoCommitDSLMigration(autoCommitEvent)
                        .zipWhen(result -> redisUtils.getAutoCommitProgress(autoCommitEvent.getApplicationId())))
                .assertNext(tuple2 -> {
                    assertThat(tuple2.getT1()).isFalse();
                    assertThat(tuple2.getT2()).isEqualTo(100);
                })
                .verifyComplete();
    }
}
