package com.appsmith.server.solutions;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PluginWorkspaceDTO;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class AuthenticationServiceTest {

    @Autowired
    AuthenticationService authenticationService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    PluginService pluginService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    UserService userService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationService applicationService;

    @SpyBean
    NewPageService newPageService;

    @Autowired
    DatasourceRepository datasourceRepository;

    Workspace workspace;

    @BeforeEach
    public void setup() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("TestWorkspace");
        workspace = workspaceService.create(newWorkspace).block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspace.getId(), permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_missingDatasource() {
        Mono<String> authorizationCodeUrlMono = authenticationService.getAuthorizationCodeURLForGenericOAuth2(
                "invalidId", FieldName.UNUSED_ENVIRONMENT_ID, "irrelevantPageId", null);

        StepVerifier.create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && ((AppsmithException) throwable).getError().equals(AppsmithError.NO_RESOURCE_FOUND)
                        && throwable.getMessage().equalsIgnoreCase("Unable to find datasource invalidId"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_invalidDatasourceWithNullAuthentication() {
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        String pageId = "irrelevantPageId";
        String branchName = "irrelevantBranchName";
        NewPage newPage = new NewPage();
        newPage.setId(pageId);
        newPage.setBranchName(branchName);

        Mockito.doReturn(Mono.just(newPage))
                .when(newPageService)
                .findById(Mockito.any(), Mockito.any(AclPermission.class));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("Missing OAuth2 datasource");
        datasource.setWorkspaceId(workspace.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        datasource.setDatasourceStorages(storages);
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .cache();

        Mono<String> authorizationCodeUrlMono = datasourceMono
                .map(BaseDomain::getId)
                .flatMap(datasourceId -> authenticationService.getAuthorizationCodeURLForGenericOAuth2(
                        datasourceId, defaultEnvironmentId, pageId, null));

        StepVerifier.create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && ((AppsmithException) throwable).getError().equals(AppsmithError.INVALID_PARAMETER)
                        && throwable.getMessage().equalsIgnoreCase("Please enter a valid parameter authentication."))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_validDatasource() {
        LinkedMultiValueMap<String, String> mockHeaders = new LinkedMultiValueMap<>(1);
        mockHeaders.add(HttpHeaders.REFERER, "https://mock.origin.com/source/uri");

        MockServerHttpRequest httpRequest =
                MockServerHttpRequest.get("").headers(mockHeaders).build();

        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("PageServiceTest TestApp");

        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());
        Application application = applicationPageService
                .createApplication(newApp, workspace.getId())
                .block();

        testPage.setApplicationId(application.getId());

        PageDTO pageDto = applicationPageService.createPage(testPage).block();

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        // install plugin
        pluginMono
                .flatMap(plugin -> {
                    return pluginService.installPlugin(PluginWorkspaceDTO.builder()
                            .pluginId(plugin.getId())
                            .workspaceId(workspace.getId())
                            .status(WorkspacePluginStatus.FREE)
                            .build());
                })
                .block();
        Datasource datasource = new Datasource();
        datasource.setName("Valid datasource for OAuth2");
        datasource.setWorkspaceId(workspace.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        OAuth2 authenticationDTO = new OAuth2();
        authenticationDTO.setClientId("ClientId");
        authenticationDTO.setClientSecret("ClientSecret");
        authenticationDTO.setAuthorizationUrl("AuthorizationURL");
        authenticationDTO.setAccessTokenUrl("AccessTokenURL");
        authenticationDTO.setScope(Set.of("Scope1", "Scope2"));
        authenticationDTO.setCustomAuthenticationParameters(Set.of(new Property("key", "value")));
        datasourceConfiguration.setAuthentication(authenticationDTO);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        datasource.setDatasourceStorages(storages);
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .cache();

        final String datasourceId1 = datasourceMono.map(BaseDomain::getId).block();

        Mono<String> authorizationCodeUrlMono = authenticationService.getAuthorizationCodeURLForGenericOAuth2(
                datasourceId1, defaultEnvironmentId, pageDto.getId(), httpRequest);

        StepVerifier.create(authorizationCodeUrlMono)
                .assertNext(url -> {
                    assertThat(url)
                            .matches(Pattern.compile("AuthorizationURL" + "\\?client_id=ClientId"
                                    + "&response_type=code"
                                    + "&redirect_uri=https://mock.origin.com/api/v1/datasources/authorize"
                                    + "&state="
                                    + String.join(
                                            ",",
                                            pageDto.getId(),
                                            datasourceId1,
                                            defaultEnvironmentId,
                                            "https://mock.origin.com",
                                            workspace.getId())
                                    + "&scope=Scope\\d%20Scope\\d"
                                    + "&key=value"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_validDatasourceAndBranchName() {
        LinkedMultiValueMap<String, String> mockHeaders = new LinkedMultiValueMap<>(1);
        mockHeaders.add(HttpHeaders.REFERER, "https://mock.origin.com/source/uri");

        MockServerHttpRequest httpRequest =
                MockServerHttpRequest.get("").headers(mockHeaders).build();

        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Test-Workspace-OAuth2-git-redirection");
        testWorkspace = workspaceService.create(testWorkspace).block();
        String workspaceId = testWorkspace == null ? "" : testWorkspace.getId();
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        String branchName = "testBranch";

        PageDTO testPage = new PageDTO();
        testPage.setName("Test-Page-oauth2-git-redirection");
        testPage.setRefName(branchName);

        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());
        Application application =
                applicationPageService.createApplication(newApp, workspaceId).block();

        testPage.setApplicationId(application.getId());

        PageDTO pageDTO = applicationPageService.createPage(testPage).block();

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        // install plugin
        pluginMono
                .flatMap(plugin -> pluginService.installPlugin(PluginWorkspaceDTO.builder()
                        .pluginId(plugin.getId())
                        .workspaceId(workspaceId)
                        .status(WorkspacePluginStatus.FREE)
                        .build()))
                .block();
        Datasource datasource = new Datasource();
        datasource.setName("Valid datasource for OAuth2");
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        OAuth2 authenticationDTO = new OAuth2();
        authenticationDTO.setClientId("ClientId");
        authenticationDTO.setClientSecret("ClientSecret");
        authenticationDTO.setAuthorizationUrl("AuthorizationURL");
        authenticationDTO.setAccessTokenUrl("AccessTokenURL");
        authenticationDTO.setScope(Set.of("Scope1", "Scope2"));
        authenticationDTO.setCustomAuthenticationParameters(Set.of(new Property("key", "value")));
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        datasource.setDatasourceStorages(storages);
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .cache();

        final String datasourceId = datasourceMono.map(BaseDomain::getId).block();

        Mono<String> authorizationCodeUrlMono = authenticationService.getAuthorizationCodeURLForGenericOAuth2(
                datasourceId, null, pageDTO.getId(), httpRequest);

        StepVerifier.create(authorizationCodeUrlMono)
                .assertNext(url -> {
                    assertThat(url)
                            .matches(Pattern.compile("AuthorizationURL" + "\\?client_id=ClientId"
                                    + "&response_type=code"
                                    + "&redirect_uri=https://mock.origin.com/api/v1/datasources/authorize"
                                    + "&state="
                                    + String.join(
                                            ",",
                                            pageDTO.getId(),
                                            datasourceId,
                                            defaultEnvironmentId,
                                            "https://mock.origin.com",
                                            workspaceId,
                                            RefType.branch.name(),
                                            branchName)
                                    + "&scope=Scope\\d%20Scope\\d"
                                    + "&key=value"));
                })
                .verifyComplete();
    }

    /**
     * Verifies that getAccessTokenForGenericOAuth2 enforces ACL permission checks
     * on the datasource ID embedded in the OAuth2 callback state parameter.
     *
     * Before the fix (APP-15028 / GHSA-rg2x-4v4h-g78w), the method used the
     * 1-argument findById(id) which skipped ACL checks, allowing any authenticated
     * user to manipulate OAuth2 credentials for datasources they had no access to.
     *
     * This test creates a real datasource, then strips all its ACL policies so the
     * caller no longer has permission to access it. The callback must then return
     * an empty Mono (no redirect URL), proving that the ACL-checked findById
     * correctly denies access.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAccessTokenForGenericOAuth2_datasourceWithoutPermission_returnsEmpty() {
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("OAuth2 ACL Denied Datasource");
        datasource.setWorkspaceId(workspace.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        OAuth2 authenticationDTO = new OAuth2();
        authenticationDTO.setClientId("ClientId");
        authenticationDTO.setClientSecret("ClientSecret");
        authenticationDTO.setAuthorizationUrl("AuthorizationURL");
        authenticationDTO.setAccessTokenUrl("AccessTokenURL");
        authenticationDTO.setScope(Set.of("Scope1"));
        authenticationDTO.setIsAuthorizationHeader(false);
        datasourceConfiguration.setAuthentication(authenticationDTO);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        datasource.setDatasourceStorages(storages);
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        Datasource createdDatasource = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .block();

        String datasourceId = createdDatasource.getId();

        // Strip all ACL policies so the caller no longer has permission
        createdDatasource.setPolicies(Set.of());
        datasourceRepository.save(createdDatasource).block();

        String state = String.join(
                ",", "fakePageId", datasourceId, defaultEnvironmentId, "https://mock.origin.com", workspace.getId());

        AuthorizationCodeCallbackDTO callbackDTO = new AuthorizationCodeCallbackDTO();
        callbackDTO.setCode("auth_code");
        callbackDTO.setState(state);

        Mono<String> resultMono = authenticationService.getAccessTokenForGenericOAuth2(callbackDTO);

        StepVerifier.create(resultMono).verifyComplete();
    }

    /**
     * Verifies that getAccessTokenForGenericOAuth2 enforces edit permission on the
     * datasource referenced in the OAuth2 callback state parameter. When a valid
     * datasource exists and the current user holds the edit permission, the method
     * should progress past the ACL check and attempt the OAuth2 token exchange
     * (which will fail because the AccessTokenUrl is not a real server).
     * The error is caught and converted into a redirect containing "appsmith_error",
     * confirming the ACL gate was passed.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAccessTokenForGenericOAuth2_authorizedDatasource_progressesPastAcl() {
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("OAuthAclTestPage");

        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());
        Application application = applicationPageService
                .createApplication(newApp, workspace.getId())
                .block();

        testPage.setApplicationId(application.getId());
        PageDTO pageDto = applicationPageService.createPage(testPage).block();

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("OAuth2 ACL Test Datasource");
        datasource.setWorkspaceId(workspace.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        OAuth2 authenticationDTO = new OAuth2();
        authenticationDTO.setClientId("ClientId");
        authenticationDTO.setClientSecret("ClientSecret");
        authenticationDTO.setAuthorizationUrl("AuthorizationURL");
        authenticationDTO.setAccessTokenUrl("http://localhost:0/non-existent-token-endpoint");
        authenticationDTO.setScope(Set.of("Scope1"));
        authenticationDTO.setIsAuthorizationHeader(false);
        datasourceConfiguration.setAuthentication(authenticationDTO);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        datasource.setDatasourceStorages(storages);
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        Datasource createdDatasource = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .block();

        String datasourceId = createdDatasource.getId();
        String redirectUrl = "https://mock.origin.com";

        String state =
                String.join(",", pageDto.getId(), datasourceId, defaultEnvironmentId, redirectUrl, workspace.getId());

        AuthorizationCodeCallbackDTO callbackDTO = new AuthorizationCodeCallbackDTO();
        callbackDTO.setCode("fake_auth_code");
        callbackDTO.setState(state);

        Mono<String> resultMono = authenticationService.getAccessTokenForGenericOAuth2(callbackDTO);

        StepVerifier.create(resultMono)
                .assertNext(url -> {
                    assertThat(url).contains("appsmith_error");
                })
                .verifyComplete();
    }
}
