package com.appsmith.server.controllers;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApiKeyService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.GitService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.external.constants.Authentication.AUTHORIZATION_HEADER;
import static com.appsmith.external.constants.Authentication.BEARER_HEADER_PREFIX;
import static java.lang.Boolean.TRUE;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureWebTestClient
public class GitControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApiKeyService apiKeyService;

    @Autowired
    private GitService gitService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @MockBean
    private GitExecutor gitExecutor;

    @MockBean
    private GitFileUtils gitFileUtils;

    @MockBean
    private ImportService importService;

    @Autowired
    private PermissionGroupService permissionGroupService;

    @Autowired
    private ApplicationPermission applicationPermission;

    private static final String mainBranch = "main";

    @Test
    public void deployApplication_WithoutSessionKey_ReturnsUnauthorizedError() {
        webTestClient
                .post()
                .uri("/api/v1/git/deploy/app/myappid")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue("{}"))
                .exchange()
                .expectStatus()
                .isEqualTo(401);
    }

    @WithUserDetails("api_user")
    @Test
    public void deployApplication_WithApiKeyButNoAccess_ReturnsError() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));

        // create a new user
        String randomUUID = UUID.randomUUID().toString();
        String botEmail = GitUtils.generateGitBotUserEmail(randomUUID);
        User botUser = new User();
        botUser.setEmail(botEmail);

        ApiKeyRequestDto requestDto = new ApiKeyRequestDto();
        requestDto.setEmail(botEmail);

        String apiKey = userRepository
                .save(botUser)
                .then(apiKeyService.generateApiKeyWithoutPermissionCheck(requestDto))
                .block();

        Application application = createTestApplication();

        webTestClient
                .post()
                .uri("/api/v1/git/deploy/app/" + application.getId() + "?branchName=" + mainBranch)
                .contentType(MediaType.APPLICATION_JSON)
                .header(AUTHORIZATION_HEADER, BEARER_HEADER_PREFIX + " " + apiKey)
                .body(BodyInserters.fromValue("{}"))
                .exchange()
                .expectStatus()
                .isEqualTo(404);
    }

    @WithUserDetails("api_user")
    @Test
    public void deployApplication_WithValidApiKey_ApplicationSuccessfullyDeployed() {
        Application application = createTestApplication();
        ApplicationJson applicationJson = new ApplicationJson();

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), eq("main"))).thenReturn(Mono.just(TRUE));
        Mockito.when(gitExecutor.rebaseBranch(any(Path.class), eq("main"))).thenReturn(Mono.just(TRUE));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepoWithAnalytics(
                        anyString(), anyString(), anyString(), anyString()))
                .thenReturn(Mono.just(applicationJson));

        Mockito.when(importService.importArtifactInWorkspaceFromGit(
                        anyString(), anyString(), any(ApplicationJson.class), anyString()))
                .thenAnswer(invocationOnMock -> (Mono.just(application)));

        gitService.toggleAutoDeploymentSettings(application.getId()).block();
        String bearerToken = gitService
                .generateBearerTokenForApplication(application.getId())
                .block();

        // fetch the application again as the policies field has been changed after bot user is added
        Application newApplication =
                applicationRepository.findById(application.getId()).block();
        // remove the edit permission for api_user from application
        Set<String> apiUserPermissionGroups =
                permissionGroupService.getSessionUserPermissionGroupIds().block();
        assert apiUserPermissionGroups != null;
        for (Policy policy : newApplication.getPolicies()) {
            if (policy.getPermission()
                    .equals(applicationPermission.getEditPermission().getValue())) {
                policy.getPermissionGroups().removeAll(apiUserPermissionGroups);
            }
        }
        applicationRepository.save(newApplication).block();

        webTestClient
                .post()
                .uri("/api/v1/git/deploy/app/" + application.getId() + "?branchName=" + mainBranch)
                .contentType(MediaType.APPLICATION_JSON)
                .header(AUTHORIZATION_HEADER, BEARER_HEADER_PREFIX + " " + bearerToken)
                .body(BodyInserters.fromValue("{}"))
                .exchange()
                .expectStatus()
                .isEqualTo(200);
    }

    private Application createTestApplication() {
        String randomString = UUID.randomUUID().toString();
        // create a workspace first
        Workspace workspace = new Workspace();
        workspace.setName("workspace_" + randomString);
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("application_" + randomString);
        application.setWorkspaceId(createdWorkspace.getId());
        Application createdApp =
                applicationPageService.createApplication(application).block();
        GitArtifactMetadata gitApplicationMetadata = new GitArtifactMetadata();
        gitApplicationMetadata.setRepoName("test-repo");
        gitApplicationMetadata.setDefaultApplicationId(createdApp.getId());
        gitApplicationMetadata.setDefaultBranchName(mainBranch);
        gitApplicationMetadata.setBranchName(mainBranch);
        createdApp.setGitApplicationMetadata(gitApplicationMetadata);
        return applicationRepository.save(createdApp).block();
    }
}
