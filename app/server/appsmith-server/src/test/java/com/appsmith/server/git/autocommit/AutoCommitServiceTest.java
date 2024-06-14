package com.appsmith.server.git.autocommit;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.git.autocommit.helpers.AutoCommitEligibilityHelper;
import com.appsmith.server.git.common.CommonGitService;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.testhelpers.git.GitFileSystemTestHelper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.git.autocommit.AutoCommitEventHandlerCEImpl.AUTO_COMMIT_MSG_FORMAT;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class AutoCommitServiceTest {

    @SpyBean
    AutoCommitService autoCommitService;

    @Autowired
    GitFileSystemTestHelper gitFileSystemTestHelper;

    @SpyBean
    GitExecutor gitExecutor;

    @MockBean
    FeatureFlagService featureFlagService;

    @MockBean
    DSLMigrationUtils dslMigrationUtils;

    @MockBean
    ApplicationService applicationService;

    @MockBean
    NewPageService newPageService;

    @Autowired
    PagePermission pagePermission;

    @SpyBean
    RedisUtils redisUtils;

    @MockBean
    CommonGitService commonGitService;

    @SpyBean
    CommonGitFileUtils commonGitFileUtils;

    @MockBean
    GitPrivateRepoHelper gitPrivateRepoHelper;

    @SpyBean
    AutoCommitEligibilityHelper autoCommitEligibilityHelper;

    @MockBean
    BranchTrackingStatus branchTrackingStatus;

    @MockBean
    UserDataService userDataService;

    @SpyBean
    JsonSchemaMigration jsonSchemaMigration;

    Application testApplication;

    Path baseRepoSuffix;

    private static final Integer DSL_VERSION_NUMBER = 88;
    private static final String WORKSPACE_ID = "test-workspace";
    private static final String REPO_NAME = "test-repo";
    private static final String BRANCH_NAME = "develop";
    private static final String APP_JSON_NAME = "autocommit.json";
    private static final String APP_NAME = "autocommit";
    private static final Integer WAIT_DURATION_FOR_ASYNC_EVENT = 5;
    private static final String PUBLIC_KEY = "public-key";
    private static final String PRIVATE_KEY = "private-key";
    private static final String REPO_URL = "domain.xy";
    private static final String DEFAULT_APP_ID = "default-app-id", DEFAULT_BRANCH_NAME = "master";
    private static final Integer SERVER_SCHEMA_VERSION = JsonSchemaVersions.serverVersion;

    private Application createApplication() {
        Application application = new Application();
        application.setName(APP_NAME);
        application.setWorkspaceId(WORKSPACE_ID);
        application.setId(DEFAULT_APP_ID);

        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId("testPageId");
        applicationPage.setIsDefault(TRUE);

        application.setPages(List.of(applicationPage));
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setBranchName(BRANCH_NAME);
        gitArtifactMetadata.setDefaultBranchName(DEFAULT_BRANCH_NAME);
        gitArtifactMetadata.setRepoName(REPO_NAME);
        gitArtifactMetadata.setDefaultApplicationId(DEFAULT_APP_ID);
        gitArtifactMetadata.setRemoteUrl(REPO_URL);

        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey(PRIVATE_KEY);
        gitAuth.setPublicKey(PUBLIC_KEY);
        gitArtifactMetadata.setGitAuth(gitAuth);

        application.setGitApplicationMetadata(gitArtifactMetadata);
        return application;
    }

    private GitProfile createGitProfile() {
        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorName("authorName");
        gitProfile.setAuthorEmail("author@domain.xy");
        return gitProfile;
    }

    private PageDTO createPageDTO() {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        jsonObject.put("version", DSL_VERSION_NUMBER);

        Layout layout1 = new Layout();
        layout1.setId("testLayoutId");
        layout1.setDsl(jsonObject);

        PageDTO pageDTO = new PageDTO();
        pageDTO.setId("testPageId");
        pageDTO.setApplicationId(DEFAULT_APP_ID);
        pageDTO.setLayouts(List.of(layout1));
        return pageDTO;
    }

    private org.json.JSONObject getMockedDsl() {
        org.json.JSONObject jsonObject = new org.json.JSONObject();
        jsonObject.put("version", DSL_VERSION_NUMBER);
        return jsonObject;
    }

    private void mockAutoCommitTriggerResponse(Boolean serverMigration, Boolean clientMigration) {
        doReturn(Mono.just(getMockedDsl()))
                .when(commonGitFileUtils)
                .getPageDslVersionNumber(anyString(), any(), any(), anyBoolean(), any());

        Integer dslVersionNumber = clientMigration ? DSL_VERSION_NUMBER + 1 : DSL_VERSION_NUMBER;
        Integer serverSchemaVersionNumber = serverMigration ? SERVER_SCHEMA_VERSION - 1 : SERVER_SCHEMA_VERSION;

        doReturn(Mono.just(dslVersionNumber)).when(dslMigrationUtils).getLatestDslVersion();

        // server as true
        doReturn(Mono.just(serverSchemaVersionNumber))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(anyString(), any(), anyBoolean(), any());
    }

    @BeforeEach
    public void beforeTest() {

        // create application
        testApplication = createApplication();
        baseRepoSuffix = Paths.get(WORKSPACE_ID, DEFAULT_APP_ID, REPO_NAME);

        // used for fetching application on autocommit service and gitAutoCommitHelper.autocommit
        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(testApplication));

        // create page-dto
        PageDTO pageDTO = createPageDTO();

        Mockito.when(newPageService.findByApplicationIdAndApplicationMode(
                        DEFAULT_APP_ID, pagePermission.getEditPermission(), ApplicationMode.PUBLISHED))
                .thenReturn(Flux.just(pageDTO));

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_autocommit_eligibility_enabled))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_autocommit_feature_enabled))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(commonGitService.fetchRemoteChanges(
                        any(Application.class), any(Application.class), anyString(), anyBoolean()))
                .thenReturn(Mono.just(branchTrackingStatus));

        Mockito.when(branchTrackingStatus.getBehindCount()).thenReturn(0);

        doReturn(Mono.just("success"))
                .when(gitExecutor)
                .pushApplication(baseRepoSuffix, REPO_URL, PUBLIC_KEY, PRIVATE_KEY, BRANCH_NAME);

        Mockito.when(applicationService.findById(anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(testApplication));

        Mockito.when(gitPrivateRepoHelper.isBranchProtected(any(), anyString())).thenReturn(Mono.just(FALSE));

        Mockito.when(userDataService.getGitProfileForCurrentUser(any())).thenReturn(Mono.just(createGitProfile()));
    }

    @AfterEach
    public void afterTest() {
        gitFileSystemTestHelper.deleteWorkspaceDirectory(WORKSPACE_ID);
    }

    @Test
    public void testAutoCommit_whenOnlyServerIsEligibleForMigration_commitSuccess()
            throws URISyntaxException, IOException, GitAPIException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource(APP_JSON_NAME));

        mockAutoCommitTriggerResponse(TRUE, FALSE);

        ApplicationJson applicationJson1 = new ApplicationJson();
        AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(applicationJson, applicationJson1);
        applicationJson1.setServerSchemaVersion(JsonSchemaVersions.serverVersion + 1);

        doReturn(Mono.just(applicationJson1))
                .when(jsonSchemaMigration)
                .migrateApplicationJsonToLatestSchema(any(ApplicationJson.class));

        gitFileSystemTestHelper.setupGitRepository(
                WORKSPACE_ID, DEFAULT_APP_ID, BRANCH_NAME, REPO_NAME, applicationJson);

        // verifying the initial number of commits
        StepVerifier.create(gitExecutor.getCommitHistory(baseRepoSuffix))
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(2);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).doesNotContain(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();

        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.empty());
        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.PUBLISHED);
                })
                .verifyComplete();

        // this would trigger autocommit
        Mono<List<GitLogDTO>> gitlogDTOsMono = Mono.delay(Duration.ofSeconds(WAIT_DURATION_FOR_ASYNC_EVENT))
                .then(gitExecutor.getCommitHistory(baseRepoSuffix));

        // verifying final number of commits
        StepVerifier.create(gitlogDTOsMono)
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(3);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).contains(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();
    }

    @Test
    public void testAutoCommit_whenOnlyClientIsEligibleForMigration_commitSuccess()
            throws GitAPIException, IOException, URISyntaxException {
        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource(APP_JSON_NAME));

        int pageDSLNumber = applicationJson
                .getPageList()
                .get(0)
                .getUnpublishedPage()
                .getLayouts()
                .get(0)
                .getDsl()
                .getAsNumber("version")
                .intValue();

        mockAutoCommitTriggerResponse(FALSE, TRUE);

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(pageDSLNumber + 1));

        JSONObject dslAfterMigration = new JSONObject();
        dslAfterMigration.put("key", "after migration");

        // mock the dsl migration utils to return updated dsl when requested with older dsl
        Mockito.when(dslMigrationUtils.migratePageDsl(any(JSONObject.class))).thenReturn(Mono.just(dslAfterMigration));

        gitFileSystemTestHelper.setupGitRepository(
                WORKSPACE_ID, DEFAULT_APP_ID, BRANCH_NAME, REPO_NAME, applicationJson);

        // verifying the initial number of commits
        StepVerifier.create(gitExecutor.getCommitHistory(baseRepoSuffix))
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(2);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).doesNotContain(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();

        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        // this would trigger autocommit
        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.PUBLISHED);
                })
                .verifyComplete();

        Mono<List<GitLogDTO>> gitlogDTOsMono = Mono.delay(Duration.ofSeconds(WAIT_DURATION_FOR_ASYNC_EVENT))
                .then(gitExecutor.getCommitHistory(baseRepoSuffix));

        // verifying final number of commits
        StepVerifier.create(gitlogDTOsMono)
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(3);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).contains(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();
    }

    @Test
    public void testAutoCommit_whenAutoCommitNotEligible_returnsFalse()
            throws URISyntaxException, IOException, GitAPIException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource(APP_JSON_NAME));

        mockAutoCommitTriggerResponse(FALSE, FALSE);

        gitFileSystemTestHelper.setupGitRepository(
                WORKSPACE_ID, DEFAULT_APP_ID, BRANCH_NAME, REPO_NAME, applicationJson);

        // verifying the initial number of commits
        StepVerifier.create(gitExecutor.getCommitHistory(baseRepoSuffix))
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(2);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).doesNotContain(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();

        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        // this would not trigger autocommit
        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.IDLE);
                })
                .verifyComplete();

        Mono<List<GitLogDTO>> gitlogDTOsMono = Mono.delay(Duration.ofSeconds(WAIT_DURATION_FOR_ASYNC_EVENT))
                .then(gitExecutor.getCommitHistory(baseRepoSuffix));

        // verifying final number of commits
        StepVerifier.create(gitlogDTOsMono)
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(2);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).doesNotContain(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();
    }

    @Test
    public void testAutoCommit_whenAutoCommitAlreadyInProgressOnAnotherBranch_returnsLocked() {
        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID))
                .thenReturn(Mono.just(DEFAULT_BRANCH_NAME));

        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.just(70));

        // this would not trigger autocommit
        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.LOCKED);
                    assertThat(autoCommitResponseDTO.getBranchName()).isEqualTo(DEFAULT_BRANCH_NAME);
                    assertThat(autoCommitResponseDTO.getProgress()).isEqualTo(70);
                })
                .verifyComplete();
    }

    @Test
    public void testAutoCommit_whenAutoCommitAlreadyInProgressOnSameBranch_returnsInProgress() {
        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.just(BRANCH_NAME));

        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.just(70));

        // this would not trigger autocommit
        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.IN_PROGRESS);
                    assertThat(autoCommitResponseDTO.getBranchName()).isEqualTo(BRANCH_NAME);
                    assertThat(autoCommitResponseDTO.getProgress()).isEqualTo(70);
                })
                .verifyComplete();
    }

    @Test
    public void testAutoCommit_whenNoGitMetadata_returnsNonGitApp() {
        testApplication.setGitApplicationMetadata(null);
        // used for fetching application on autocommit service and gitAutoCommitHelper.autocommit
        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(testApplication));

        // this would not trigger autocommit
        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.NON_GIT_APP);
                })
                .verifyComplete();
    }

    @Test
    public void testAutoCommit_whenAutoCommitEligibleButPrerequisiteNotComplete_returnsRequired() {

        mockAutoCommitTriggerResponse(TRUE, FALSE);

        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        // number of commits behind to make the pre-req fail
        Mockito.when(branchTrackingStatus.getBehindCount()).thenReturn(1);

        // this would not trigger autocommit
        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.REQUIRED);
                })
                .verifyComplete();
    }

    @Test
    public void
            testAutoCommit_whenServerIsRunningMigrationCallsAutocommitAgainOnSameBranch_ReturnsAutoCommitInProgress()
                    throws URISyntaxException, IOException, GitAPIException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource(APP_JSON_NAME));

        mockAutoCommitTriggerResponse(TRUE, FALSE);

        ApplicationJson applicationJson1 = new ApplicationJson();
        AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(applicationJson, applicationJson1);
        applicationJson1.setServerSchemaVersion(JsonSchemaVersions.serverVersion + 1);

        doReturn(Mono.just(applicationJson1))
                .when(jsonSchemaMigration)
                .migrateApplicationJsonToLatestSchema(any(ApplicationJson.class));

        gitFileSystemTestHelper.setupGitRepository(
                WORKSPACE_ID, DEFAULT_APP_ID, BRANCH_NAME, REPO_NAME, applicationJson);

        // verifying the initial number of commits
        StepVerifier.create(gitExecutor.getCommitHistory(baseRepoSuffix))
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(2);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).doesNotContain(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();

        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.empty());
        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                        .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.PUBLISHED))
                .verifyComplete();

        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.just(BRANCH_NAME));
        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.just(20));

        StepVerifier.create(autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME))
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.IN_PROGRESS);
                    assertThat(autoCommitResponseDTO.getBranchName()).isEqualTo(BRANCH_NAME);
                })
                .verifyComplete();

        // this would trigger autocommit
        Mono<List<GitLogDTO>> gitlogDTOsMono = Mono.delay(Duration.ofSeconds(WAIT_DURATION_FOR_ASYNC_EVENT))
                .then(gitExecutor.getCommitHistory(baseRepoSuffix));

        // verifying final number of commits
        StepVerifier.create(gitlogDTOsMono)
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(3);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).contains(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();
    }

    @Test
    public void testAutoCommit_whenServerIsRunningMigrationCallsAutocommitAgainOnDiffBranch_ReturnsAutoCommitLocked()
            throws URISyntaxException, IOException, GitAPIException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource(APP_JSON_NAME));

        mockAutoCommitTriggerResponse(TRUE, FALSE);

        ApplicationJson applicationJson1 = new ApplicationJson();
        AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(applicationJson, applicationJson1);
        applicationJson1.setServerSchemaVersion(JsonSchemaVersions.serverVersion + 1);

        doReturn(Mono.just(applicationJson1))
                .when(jsonSchemaMigration)
                .migrateApplicationJsonToLatestSchema(any(ApplicationJson.class));

        gitFileSystemTestHelper.setupGitRepository(
                WORKSPACE_ID, DEFAULT_APP_ID, BRANCH_NAME, REPO_NAME, applicationJson);

        // verifying the initial number of commits
        StepVerifier.create(gitExecutor.getCommitHistory(baseRepoSuffix))
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(2);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).doesNotContain(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();

        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.empty());

        Mono<AutoCommitResponseDTO> autoCommitResponseDTOMono =
                autoCommitService.autoCommitApplication(testApplication.getId(), BRANCH_NAME);

        StepVerifier.create(autoCommitResponseDTOMono)
                .assertNext(autoCommitResponseDTO -> assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                        .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.PUBLISHED))
                .verifyComplete();

        // redis-utils fixing
        Mockito.when(redisUtils.getRunningAutoCommitBranchName(DEFAULT_APP_ID)).thenReturn(Mono.just(BRANCH_NAME));

        Mockito.when(redisUtils.getAutoCommitProgress(DEFAULT_APP_ID)).thenReturn(Mono.just(20));

        StepVerifier.create(autoCommitService.autoCommitApplication(testApplication.getId(), DEFAULT_BRANCH_NAME))
                .assertNext(autoCommitResponseDTO -> {
                    assertThat(autoCommitResponseDTO.getAutoCommitResponse())
                            .isEqualTo(AutoCommitResponseDTO.AutoCommitResponse.LOCKED);
                    assertThat(autoCommitResponseDTO.getBranchName()).isEqualTo(BRANCH_NAME);
                })
                .verifyComplete();

        // this would trigger autocommit
        Mono<List<GitLogDTO>> gitlogDTOsMono = Mono.delay(Duration.ofSeconds(WAIT_DURATION_FOR_ASYNC_EVENT))
                .then(gitExecutor.getCommitHistory(baseRepoSuffix));

        // verifying final number of commits
        StepVerifier.create(gitlogDTOsMono)
                .assertNext(gitLogDTOs -> {
                    assertThat(gitLogDTOs).isNotEmpty();
                    assertThat(gitLogDTOs.size()).isEqualTo(3);

                    Set<String> commitMessages =
                            gitLogDTOs.stream().map(GitLogDTO::getCommitMessage).collect(Collectors.toSet());
                    assertThat(commitMessages).contains(String.format(AUTO_COMMIT_MSG_FORMAT, "UNKNOWN"));
                })
                .verifyComplete();
    }
}
