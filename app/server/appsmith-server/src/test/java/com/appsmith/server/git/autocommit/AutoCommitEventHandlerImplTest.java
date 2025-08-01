package com.appsmith.server.git.autocommit;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.testhelpers.git.GitFileSystemTestHelper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.git.autocommit.AutoCommitEventHandlerCEImpl.AUTO_COMMIT_MSG_FORMAT;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;

@SpringBootTest
@Slf4j
@DirtiesContext
public class AutoCommitEventHandlerImplTest {
    @MockBean
    ApplicationEventPublisher applicationEventPublisher;

    @SpyBean
    RedisUtils redisUtils;

    @SpyBean
    GitRedisUtils gitRedisUtils;

    @Autowired
    AnalyticsService analyticsService;

    @MockBean
    DSLMigrationUtils dslMigrationUtils;

    @SpyBean
    FileInterface fileUtils;

    @SpyBean
    CommonGitFileUtils commonGitFileUtils;

    @SpyBean
    JsonSchemaMigration jsonSchemaMigration;

    @SpyBean
    FSGitHandler fsGitHandler;

    @Autowired
    GitArtifactHelperResolver gitArtifactHelperResolver;

    @Autowired
    GitFileSystemTestHelper gitFileSystemTestHelper;

    @Autowired
    ProjectProperties projectProperties;

    AutoCommitEventHandler autoCommitEventHandler;

    JsonSchemaVersions jsonSchemaVersions = new JsonSchemaVersions();

    private static final String defaultApplicationId = "default-app-id",
            branchName = "develop",
            workspaceId = "test-workspace-id";

    @BeforeEach
    public void beforeTest() {
        autoCommitEventHandler = new AutoCommitEventHandlerImpl(
                applicationEventPublisher,
                gitRedisUtils,
                redisUtils,
                dslMigrationUtils,
                gitArtifactHelperResolver,
                commonGitFileUtils,
                fsGitHandler,
                projectProperties,
                analyticsService);
    }

    @AfterEach
    public void afterTest() {
        redisUtils.finishAutoCommit(defaultApplicationId).block();
        redisUtils.releaseFileLock(defaultApplicationId).block();
        gitFileSystemTestHelper.deleteWorkspaceDirectory(workspaceId);
    }

    @Test
    public void autoCommitDSLMigration_WhenAutoCommitAlreadyStarted_ReturnsFalse() {
        AutoCommitEvent autoCommitEvent = new AutoCommitEvent();
        autoCommitEvent.setApplicationId(defaultApplicationId);
        autoCommitEvent.setBranchName(branchName);

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(10));

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
        autoCommitEvent.setApplicationId(defaultApplicationId + UUID.randomUUID());
        autoCommitEvent.setBranchName(branchName);
        autoCommitEvent.setRepoName("test-repo");
        autoCommitEvent.setAuthorName("test author");
        autoCommitEvent.setAuthorEmail("testauthor@example.com");
        autoCommitEvent.setWorkspaceId(workspaceId);
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
        newPage.setGitSyncId("p1");
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

        String workspaceId = autoCommitEvent.getWorkspaceId();
        String artifactId = autoCommitEvent.getApplicationId();
        String repoName = autoCommitEvent.getRepoName();
        String refName = autoCommitEvent.getBranchName();
        ArtifactType artifactType = applicationJson.getArtifactJsonType();

        ArtifactJsonTransformationDTO jsonTransformationDTO =
                new ArtifactJsonTransformationDTO(workspaceId, artifactId, repoName, artifactType);
        jsonTransformationDTO.setRefType(RefType.branch);
        jsonTransformationDTO.setRefName(refName);

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

        doReturn(Mono.just(TRUE))
                .when(fsGitHandler)
                .resetToLastCommit(baseRepoSuffix, autoCommitEvent.getBranchName(), true);

        doReturn(Mono.just(applicationJson))
                .when(commonGitFileUtils)
                .constructArtifactExchangeJsonFromGitRepository(jsonTransformationDTO);

        // mock the dsl migration utils to return updated dsl when requested with older dsl
        Mockito.when(dslMigrationUtils.migratePageDsl(any(JSONObject.class))).thenReturn(Mono.just(dslAfterMigration));

        doReturn(Mono.just(baseRepoSuffix))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoNew(baseRepoSuffix, applicationJson, autoCommitEvent.getBranchName());

        doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .commitArtifact(
                        baseRepoSuffix,
                        String.format(AUTO_COMMIT_MSG_FORMAT, projectProperties.getVersion()),
                        autoCommitEvent.getAuthorName(),
                        autoCommitEvent.getAuthorEmail(),
                        false,
                        false);

        doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .pushArtifact(
                        baseRepoSuffix,
                        autoCommitEvent.getRepoUrl(),
                        autoCommitEvent.getPublicKey(),
                        autoCommitEvent.getPrivateKey(),
                        autoCommitEvent.getBranchName());

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

        String workspaceId = autoCommitEvent.getWorkspaceId();
        String artifactId = autoCommitEvent.getApplicationId();
        String repoName = autoCommitEvent.getRepoName();
        String refName = autoCommitEvent.getBranchName();
        ArtifactType artifactType = applicationJson.getArtifactJsonType();

        ArtifactJsonTransformationDTO jsonTransformationDTO =
                new ArtifactJsonTransformationDTO(workspaceId, artifactId, repoName, artifactType);
        jsonTransformationDTO.setRefType(RefType.branch);
        jsonTransformationDTO.setRefName(refName);

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

        doReturn(Mono.just(TRUE))
                .when(fsGitHandler)
                .resetToLastCommit(baseRepoSuffix, autoCommitEvent.getBranchName(), true);

        doReturn(Mono.just(applicationJson))
                .when(commonGitFileUtils)
                .constructArtifactExchangeJsonFromGitRepository(jsonTransformationDTO);

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

    @Test
    public void autoCommitServerMigration_WhenServerRequiresMigration() throws GitAPIException, IOException {
        AutoCommitEvent autoCommitEvent = createEvent();
        autoCommitEvent.setIsServerSideEvent(TRUE);
        ApplicationJson applicationJson = createApplicationJson();

        String workspaceId = autoCommitEvent.getWorkspaceId();
        String artifactId = autoCommitEvent.getApplicationId();
        String repoName = autoCommitEvent.getRepoName();
        String refName = autoCommitEvent.getBranchName();
        ArtifactType artifactType = applicationJson.getArtifactJsonType();

        ArtifactJsonTransformationDTO jsonTransformationDTO =
                new ArtifactJsonTransformationDTO(workspaceId, artifactId, repoName, artifactType);
        jsonTransformationDTO.setRefType(RefType.branch);
        jsonTransformationDTO.setRefName(refName);

        Path baseRepoSuffix = Paths.get(
                autoCommitEvent.getWorkspaceId(), autoCommitEvent.getApplicationId(), autoCommitEvent.getRepoName());

        doReturn(Mono.just(TRUE))
                .when(fsGitHandler)
                .resetToLastCommit(baseRepoSuffix, autoCommitEvent.getBranchName(), true);

        doReturn(Mono.just(applicationJson))
                .when(commonGitFileUtils)
                .constructArtifactExchangeJsonFromGitRepository(jsonTransformationDTO);

        doReturn(Mono.just(baseRepoSuffix))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoNew(baseRepoSuffix, applicationJson, autoCommitEvent.getBranchName());

        doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .commitArtifact(
                        baseRepoSuffix,
                        String.format(AUTO_COMMIT_MSG_FORMAT, projectProperties.getVersion()),
                        autoCommitEvent.getAuthorName(),
                        autoCommitEvent.getAuthorEmail(),
                        false,
                        false);

        doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .pushArtifact(
                        baseRepoSuffix,
                        autoCommitEvent.getRepoUrl(),
                        autoCommitEvent.getPublicKey(),
                        autoCommitEvent.getPrivateKey(),
                        autoCommitEvent.getBranchName());

        StepVerifier.create(autoCommitEventHandler
                        .autoCommitServerMigration(autoCommitEvent)
                        .zipWhen(result -> redisUtils.getAutoCommitProgress(autoCommitEvent.getApplicationId())))
                .assertNext(tuple2 -> {
                    assertThat(tuple2.getT1()).isTrue();
                    assertThat(tuple2.getT2()).isEqualTo(100);
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitServerMigration_WhenAutoCommitAlreadyStarted_ReturnsFalse() {
        AutoCommitEvent autoCommitEvent = new AutoCommitEvent();
        autoCommitEvent.setApplicationId(defaultApplicationId);
        autoCommitEvent.setBranchName(branchName);

        Mono<Boolean> map = redisUtils
                .startAutoCommit(defaultApplicationId, branchName)
                .then(autoCommitEventHandler.autoCommitServerMigration(autoCommitEvent));

        StepVerifier.create(map)
                .assertNext(x -> {
                    assertThat(x).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @Disabled
    public void autoCommitServerMigration_WhenServerHasNoChanges_NoCommitMade() throws GitAPIException, IOException {
        AutoCommitEvent autoCommitEvent = createEvent();
        autoCommitEvent.setIsServerSideEvent(TRUE);
        ApplicationJson applicationJson = createApplicationJson();

        String workspaceId = autoCommitEvent.getWorkspaceId();
        String artifactId = autoCommitEvent.getApplicationId();
        String repoName = autoCommitEvent.getRepoName();
        String refName = autoCommitEvent.getBranchName();
        ArtifactType artifactType = applicationJson.getArtifactJsonType();

        ArtifactJsonTransformationDTO jsonTransformationDTO =
                new ArtifactJsonTransformationDTO(workspaceId, artifactId, repoName, artifactType);
        jsonTransformationDTO.setRefType(RefType.branch);
        jsonTransformationDTO.setRefName(refName);

        Path baseRepoSuffix = Paths.get(
                autoCommitEvent.getWorkspaceId(), autoCommitEvent.getApplicationId(), autoCommitEvent.getRepoName());

        doReturn(Mono.just(TRUE))
                .when(fsGitHandler)
                .resetToLastCommit(baseRepoSuffix, autoCommitEvent.getBranchName(), true);

        doReturn(Mono.just(applicationJson))
                .when(commonGitFileUtils)
                .constructArtifactExchangeJsonFromGitRepository(jsonTransformationDTO);

        doReturn(Mono.just(baseRepoSuffix))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoNew(baseRepoSuffix, applicationJson, autoCommitEvent.getBranchName());

        // the rest of the process should not trigger as no migration is required
        StepVerifier.create(autoCommitEventHandler
                        .autoCommitServerMigration(autoCommitEvent)
                        .zipWhen(result -> redisUtils.getAutoCommitProgress(autoCommitEvent.getApplicationId())))
                .assertNext(tuple2 -> {
                    assertThat(tuple2.getT1()).isFalse();
                    assertThat(tuple2.getT2()).isEqualTo(100);
                })
                .verifyComplete();
    }

    @Test
    public void
            autoCommitServerMigration_WhenNoAutoCommitInProgress_AllStepsSuccessfullyCompleted_CaseJsonSchemaMigration()
                    throws GitAPIException, IOException, URISyntaxException {

        AutoCommitEvent autoCommitEvent = createEvent();
        autoCommitEvent.setIsServerSideEvent(TRUE);
        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        Path baseRepoSuffix = Paths.get(
                autoCommitEvent.getWorkspaceId(), autoCommitEvent.getApplicationId(), autoCommitEvent.getRepoName());

        doReturn(Mono.just(TRUE))
                .when(fsGitHandler)
                .resetToLastCommit(baseRepoSuffix, autoCommitEvent.getBranchName(), true);

        GitResourceMap gitResourceMap = commonGitFileUtils.createGitResourceMap(applicationJson);

        doReturn(Mono.just(gitResourceMap))
                .when(fileUtils)
                .constructGitResourceMapFromGitRepo(baseRepoSuffix, autoCommitEvent.getBranchName());

        doReturn(Mono.just(baseRepoSuffix))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoNew(any(Path.class), any(ApplicationJson.class), anyString());

        ApplicationJson applicationJson1 = new ApplicationJson();
        AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(applicationJson, applicationJson1);
        applicationJson1.setServerSchemaVersion(jsonSchemaVersions.getServerVersion() + 1);

        doReturn(Mono.just(applicationJson1))
                .when(jsonSchemaMigration)
                .migrateApplicationJsonToLatestSchema(
                        Mockito.eq(applicationJson), Mockito.anyString(), Mockito.anyString(), any(RefType.class));

        doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .commitArtifact(
                        baseRepoSuffix,
                        String.format(AUTO_COMMIT_MSG_FORMAT, projectProperties.getVersion()),
                        autoCommitEvent.getAuthorName(),
                        autoCommitEvent.getAuthorEmail(),
                        false,
                        false);

        doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .pushArtifact(
                        baseRepoSuffix,
                        autoCommitEvent.getRepoUrl(),
                        autoCommitEvent.getPublicKey(),
                        autoCommitEvent.getPrivateKey(),
                        autoCommitEvent.getBranchName());

        StepVerifier.create(autoCommitEventHandler
                        .autoCommitServerMigration(autoCommitEvent)
                        .zipWhen(a -> redisUtils.getAutoCommitProgress(autoCommitEvent.getApplicationId())))
                .assertNext(tuple2 -> {
                    assertThat(tuple2.getT1()).isTrue();
                    assertThat(tuple2.getT2()).isEqualTo(100);
                })
                .verifyComplete();
    }

    @Test
    @Disabled
    // This test doesn't apply anymore, got to change it
    public void autocommitServerMigration_WhenSerialisationLogicDoesNotChange_CommitFailure()
            throws URISyntaxException, IOException, GitAPIException {

        AutoCommitEvent autoCommitEvent = createEvent();
        autoCommitEvent.setIsServerSideEvent(TRUE);
        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        gitFileSystemTestHelper.setupGitRepository(autoCommitEvent, applicationJson);
        StepVerifier.create(autoCommitEventHandler
                        .autoCommitServerMigration(autoCommitEvent)
                        .zipWhen(a -> redisUtils.getAutoCommitProgress(autoCommitEvent.getApplicationId())))
                .assertNext(tuple2 -> {
                    // This should fail as there won't be any changes to commit
                    assertThat(tuple2.getT1()).isFalse();
                    assertThat(tuple2.getT2()).isEqualTo(100);
                })
                .verifyComplete();
    }

    @Test
    public void autocommitServerMigration_WhenJsonSchemaMigrationPresent_CommitSuccess()
            throws URISyntaxException, IOException, GitAPIException {

        AutoCommitEvent autoCommitEvent = createEvent();
        autoCommitEvent.setIsServerSideEvent(TRUE);
        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        Path baseRepoSuffix = Paths.get(
                autoCommitEvent.getWorkspaceId(), autoCommitEvent.getApplicationId(), autoCommitEvent.getRepoName());

        doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .pushArtifact(
                        baseRepoSuffix,
                        autoCommitEvent.getRepoUrl(),
                        autoCommitEvent.getPublicKey(),
                        autoCommitEvent.getPrivateKey(),
                        autoCommitEvent.getBranchName());

        ApplicationJson applicationJson1 = new ApplicationJson();
        AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(applicationJson, applicationJson1);
        applicationJson1.setServerSchemaVersion(jsonSchemaVersions.getServerVersion() + 1);

        doReturn(Mono.just(applicationJson1))
                .when(jsonSchemaMigration)
                .migrateApplicationJsonToLatestSchema(
                        any(), Mockito.anyString(), Mockito.anyString(), any(RefType.class));

        gitFileSystemTestHelper.setupGitRepository(autoCommitEvent, applicationJson);

        StepVerifier.create(autoCommitEventHandler
                        .autoCommitServerMigration(autoCommitEvent)
                        .zipWhen(a -> redisUtils.getAutoCommitProgress(autoCommitEvent.getApplicationId())))
                .assertNext(tuple2 -> {
                    assertThat(tuple2.getT1()).isTrue();
                    assertThat(tuple2.getT2()).isEqualTo(100);
                })
                .verifyComplete();

        StepVerifier.create(fsGitHandler.getCommitHistory(baseRepoSuffix))
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(3);
                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages)
                            .contains(String.format(AUTO_COMMIT_MSG_FORMAT, projectProperties.getVersion()));
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitDSLMigration_WithFS_WhenNoAutoCommitInProgress_AllStepsSuccessfullyCompleted()
            throws GitAPIException, IOException, URISyntaxException {

        AutoCommitEvent autoCommitEvent = createEvent();
        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource("application.json"));

        JSONObject dslBeforeMigration = applicationJson
                .getPageList()
                .get(0)
                .getUnpublishedPage()
                .getLayouts()
                .get(0)
                .getDsl();

        int currentDslVersion = dslBeforeMigration.getAsNumber("version").intValue();
        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(currentDslVersion + 1));

        Path baseRepoSuffix = Paths.get(
                autoCommitEvent.getWorkspaceId(), autoCommitEvent.getApplicationId(), autoCommitEvent.getRepoName());

        JSONObject dslAfterMigration = new JSONObject();
        dslAfterMigration.put("key", "after migration");

        // mock the dsl migration utils to return updated dsl when requested with older dsl
        Mockito.when(dslMigrationUtils.migratePageDsl(any(JSONObject.class))).thenReturn(Mono.just(dslAfterMigration));

        doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .pushArtifact(
                        baseRepoSuffix,
                        autoCommitEvent.getRepoUrl(),
                        autoCommitEvent.getPublicKey(),
                        autoCommitEvent.getPrivateKey(),
                        autoCommitEvent.getBranchName());

        gitFileSystemTestHelper.setupGitRepository(autoCommitEvent, applicationJson);
        StepVerifier.create(autoCommitEventHandler
                        .autoCommitDSLMigration(autoCommitEvent)
                        .zipWhen(a -> redisUtils.getAutoCommitProgress(autoCommitEvent.getApplicationId())))
                .assertNext(tuple2 -> {
                    assertThat(tuple2.getT1()).isTrue();
                    assertThat(tuple2.getT2()).isEqualTo(100);
                })
                .verifyComplete();
    }
}
