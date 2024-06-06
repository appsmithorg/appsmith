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
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.git.autocommit.helpers.AutoCommitEligibilityHelper;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.CommonGitService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.testhelpers.git.GitFileSystemTestHelper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
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

import static com.appsmith.server.git.AutoCommitEventHandlerCEImpl.AUTO_COMMIT_MSG_FORMAT;
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
public class ApplicationPageServiceAutoCommitTest {

    @SpyBean
    ApplicationPageService applicationPageService;

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

    @MockBean
    CommonGitService commonGitService;

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

    private NewPage createNewPage() {
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

        NewPage newPage = new NewPage();
        newPage.setId("testPageId");
        newPage.setApplicationId(DEFAULT_APP_ID);
        newPage.setUnpublishedPage(pageDTO);
        return newPage;
    }

    @BeforeEach
    public void beforeTest() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_server_autocommit_feature_enabled))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_autocommit_feature_enabled))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(commonGitService.fetchRemoteChanges(
                        any(Application.class), any(Application.class), anyString(), anyBoolean()))
                .thenReturn(Mono.just(branchTrackingStatus));

        Mockito.when(branchTrackingStatus.getBehindCount()).thenReturn(0);

        // create New Pages
        NewPage newPage = createNewPage();

        // create application
        testApplication = createApplication();
        baseRepoSuffix = Paths.get(WORKSPACE_ID, DEFAULT_APP_ID, REPO_NAME);

        doReturn(Mono.just("success"))
                .when(gitExecutor)
                .pushApplication(baseRepoSuffix, REPO_URL, PUBLIC_KEY, PRIVATE_KEY, BRANCH_NAME);

        doReturn(Mono.just(newPage.getUnpublishedPage()))
                .when(applicationPageService)
                .getPage(any(NewPage.class), anyBoolean());

        Mockito.when(newPageService.findNewPagesByApplicationId(anyString(), any(AclPermission.class)))
                .thenReturn(Flux.just(newPage));

        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(testApplication));

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
    @Disabled
    public void testAutoCommit_whenOnlyServerIsEligibleForMigration_commitSuccess()
            throws URISyntaxException, IOException, GitAPIException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource(APP_JSON_NAME));

        doReturn(Mono.just(new AutoCommitTriggerDTO(TRUE, FALSE, TRUE)))
                .when(autoCommitEligibilityHelper)
                .isAutoCommitRequired(anyString(), any(GitArtifactMetadata.class), any(PageDTO.class));

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

        // this would trigger autocommit
        Mono<List<GitLogDTO>> gitlogDTOsMono = applicationPageService
                .getPagesBasedOnApplicationMode(testApplication, ApplicationMode.EDIT)
                .then(Mono.delay(Duration.ofSeconds(WAIT_DURATION_FOR_ASYNC_EVENT)))
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
    @Disabled
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

        doReturn(Mono.just(new AutoCommitTriggerDTO(TRUE, TRUE, FALSE)))
                .when(autoCommitEligibilityHelper)
                .isAutoCommitRequired(anyString(), any(GitArtifactMetadata.class), any(PageDTO.class));

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

        // this would trigger autocommit
        Mono<List<GitLogDTO>> gitlogDTOsMono = applicationPageService
                .getPagesBasedOnApplicationMode(testApplication, ApplicationMode.EDIT)
                .then(Mono.delay(Duration.ofSeconds(WAIT_DURATION_FOR_ASYNC_EVENT)))
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
    @Disabled
    public void testAutoCommit_whenAutoCommitNotEligible_returnsFalse()
            throws URISyntaxException, IOException, GitAPIException {

        ApplicationJson applicationJson =
                gitFileSystemTestHelper.getApplicationJson(this.getClass().getResource(APP_JSON_NAME));

        doReturn(Mono.just(new AutoCommitTriggerDTO(FALSE, FALSE, FALSE)))
                .when(autoCommitEligibilityHelper)
                .isAutoCommitRequired(anyString(), any(GitArtifactMetadata.class), any(PageDTO.class));

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

        // this would not trigger autocommit
        Mono<List<GitLogDTO>> gitlogDTOsMono = applicationPageService
                .getPagesBasedOnApplicationMode(testApplication, ApplicationMode.EDIT)
                .then(Mono.delay(Duration.ofSeconds(WAIT_DURATION_FOR_ASYNC_EVENT)))
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
}
