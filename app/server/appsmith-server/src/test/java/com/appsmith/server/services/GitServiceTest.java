package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.JSValue;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.assertj.core.api.Assertions;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class GitServiceTest {

    @Autowired
    GitService gitDataService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    UserService userService;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
    GitFileUtils gitFileUtils;

    @MockBean
    UserDataService userDataService;

    @MockBean
    ImportExportApplicationService importExportApplicationService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    String orgId;
    private static final String DEFAULT_GIT_PROFILE = "default";

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg.getId();
    }

    private GitProfile getConfigRequest(String commitEmail, String author) {
        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorEmail(commitEmail);
        gitProfile.setAuthorName(author);
        return gitProfile;
    }

    private GitConnectDTO getConnectRequest(String remoteUrl, GitProfile gitProfile) {
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(remoteUrl);
        gitConnectDTO.setGitProfile(gitProfile);
        return gitConnectDTO;
    }

    private Application createApplication(String applicationName, String branchName) {
        Application testApplication = new Application();
        testApplication.setName(applicationName);
        testApplication.setOrganizationId(orgId);
        Application application = applicationPageService.createApplication(testApplication).block();

        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRemoteUrl("test.com");
        gitApplicationMetadata.setDefaultBranchName("defaultBranch");
        gitApplicationMetadata.setBranchName(branchName);
        gitApplicationMetadata.setDefaultApplicationId(application.getId());
        gitApplicationMetadata.setRepoName("testRepo");
        application.setGitApplicationMetadata(gitApplicationMetadata);
        return applicationService.save(application).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyRemoteUrl_ThrowInvalidParameterException() {
        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        GitConnectDTO gitConnectDTO = getConnectRequest(null, gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit("testID", gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Remote Url")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyOriginHeader_ThrowInvalidParameterException() {
        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        GitConnectDTO gitConnectDTO = getConnectRequest("sshUrl", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit("testID", gitConnectDTO, null);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidGitApplicationMetadata_ThrowInvalidGitConfigurationException() {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));
        User user = new User();
        user.setId("userId");
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        testApplication.setName("InvalidGitApplicationMetadata");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application1));

        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyPrivateKey_ThrowInvalidGitConfigurationException() {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));
        User user = new User();
        user.setId("userId");
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("publicKey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setName("EmptyPrivateKey");
        testApplication.setOrganizationId(orgId);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyPublicKey_ThrowInvalidGitConfigurationException() {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));
        User user = new User();
        user.setId("userId");
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setName("EmptyPublicKey");
        testApplication.setOrganizationId(orgId);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidRemoteUrl_ThrowInvalidRemoteUrl() throws IOException {

        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));

        User user = new User();
        user.setId("userId");

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("InvalidRemoteUrl");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", gitProfile);

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(), Mockito.any())).thenReturn(Mono.just(userData));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(false));
        MockedStatic<GitUtils> gitUtilsMockedStatic = Mockito.mockStatic(GitUtils.class);
        gitUtilsMockedStatic.when(() -> GitUtils.isRepoPrivate(Mockito.anyString()))
                .thenReturn(Boolean.FALSE);
        gitUtilsMockedStatic.when(() -> GitUtils.convertSshUrlToHttpsCurlSupportedUrl(Mockito.anyString()))
                .thenReturn("https://test.com/.git");

        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidFilePath_ThrowIOException() throws IOException {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));
        User user = new User();
        user.setId("userId");

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenThrow(new IOException("Error while accessing the file system"));
        Mockito.when(importExportApplicationService.exportApplicationById(Mockito.anyString(), Mockito.any(SerialiseApplicationObjective.class)))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("InvalidFilePath");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application1));

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Error while accessing the file system"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_ClonedRepoNotEmpty_Failure() throws IOException {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));
        User user = new User();
        user.setId("userId");
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(importExportApplicationService.exportApplicationById(Mockito.anyString(), Mockito.any(SerialiseApplicationObjective.class)))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(false));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("ValidTest TestApp");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();
        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application1));

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_REPO.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithEmptyPublishedPages_CloneSuccess() throws IOException {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));
        User user = new User();
        user.setId("userId");

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeGitRepo(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(importExportApplicationService.exportApplicationById(Mockito.anyString(), Mockito.any(SerialiseApplicationObjective.class)))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        gitApplicationMetadata.setBranchName("defaultBranchNameFromRemote");
        gitApplicationMetadata.setRepoName("testRepo");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("validData_WithEmptyPublishedPages");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application1));

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchNameFromRemote");
                    assertThat(gitApplicationMetadata1.getGitAuth().getPrivateKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getGeneratedAt()).isNotNull();
                    assertThat(gitApplicationMetadata1.getRepoName()).isEqualTo("testRepo");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithoutGitProfileUsingDefaultProfile_CloneSuccess() throws IOException {
        UserData userData = new UserData();
        User user = new User();
        user.setId("userId");
        user.setEmail("user@test.com");

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeGitRepo(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(importExportApplicationService.exportApplicationById(Mockito.anyString(), Mockito.any(SerialiseApplicationObjective.class)))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest(null, null);
        gitProfile.setUseGlobalProfile(true);
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        gitApplicationMetadata.setBranchName("defaultBranchNameFromRemote");
        gitApplicationMetadata.setRepoName("testRepo");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("emptyDefaultProfileConnectTest");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application1));

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchNameFromRemote");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithoutGitProfileUsingLocalProfile_ThrowAuthorNameUnavailableError() throws IOException {
        UserData userData = new UserData();
        User user = new User();
        user.setId("userId");
        user.setEmail("user@test.com");

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest(null, null);
        // Use repo specific git profile but as this is empty default profile will be used as a fallback
        gitProfile.setUseGlobalProfile(false);
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        gitApplicationMetadata.setBranchName("defaultBranchNameFromRemote");
        gitApplicationMetadata.setRepoName("testRepo");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("localGitProfile");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Name")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithNonEmptyPublishedPages_CloneSuccess() throws IOException {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));
        User user = new User();
        user.setId("userId");

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeGitRepo(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(importExportApplicationService.exportApplicationById(Mockito.anyString(), Mockito.any(SerialiseApplicationObjective.class)))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(User.class), Mockito.any(UserData.class))).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        gitApplicationMetadata.setBranchName("defaultBranchNameFromRemote");
        gitApplicationMetadata.setRepoName("testRepo");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("connectApplicationToGit_WithNonEmptyPublishedPages");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application1));

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchNameFromRemote");
                    assertThat(gitApplicationMetadata1.getGitAuth().getPrivateKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getGeneratedAt()).isNotNull();
                    assertThat(gitApplicationMetadata1.getRepoName()).isEqualTo("testRepo");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateGitMetadata_EmptyData_Success() {
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("updateGitMetadata_EmptyData_Success");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();
        GitApplicationMetadata gitApplicationMetadata1 = null;

        Mono<Application> applicationMono = gitDataService.updateGitMetadata(application1.getId(), gitApplicationMetadata1);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("Git metadata values cannot be null"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateGitMetadata_validData_Success() {
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("updateGitMetadata_EmptyData_Success1");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();
        GitApplicationMetadata gitApplicationMetadata1 = application1.getGitApplicationMetadata();
        gitApplicationMetadata1.setRemoteUrl("https://test/.git");

        Mono<Application> applicationMono = gitDataService.updateGitMetadata(application1.getId(), gitApplicationMetadata1);

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl()).isEqualTo("https://test/.git");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void detachRemote_validData_Success() {
        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("defaultBranch");
        branchList.add(gitBranchDTO);

        GitBranchDTO remoteGitBranchDTO = new GitBranchDTO();
        remoteGitBranchDTO.setBranchName("origin/defaultBranch");
        branchList.add(remoteGitBranchDTO);

        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), eq(false)))
                .thenReturn(Mono.just(branchList));
        Mockito.when(gitFileUtils.detachRemote(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setRemoteUrl("test.com");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRepoName("repoName");
        gitApplicationMetadata.setDefaultApplicationId("TestId");
        gitApplicationMetadata.setDefaultBranchName("defaultBranchFromRemote");
        gitApplicationMetadata.setBranchName("defaultBranch");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("detachRemote_validData");
        testApplication.setOrganizationId(orgId);

        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication)
                .flatMap(application -> {
                    // Update the defaultIds for resources to mock merge action from other branch
                    application.getPages().forEach(page -> page.setDefaultPageId(page.getId() + "randomId"));
                    return Mono.zip(
                            applicationService.save(application),
                            pluginRepository.findByPackageName("installed-plugin"),
                            newPageService.findPageById(application.getPages().get(0).getId(), READ_PAGES, false)
                    );
                })
                .flatMap(tuple -> {

                    Application application = tuple.getT1();
                    PageDTO testPage = tuple.getT3();

                    // Save action
                    Datasource datasource = new Datasource();
                    datasource.setName("Default Database");
                    datasource.setOrganizationId(application.getOrganizationId());
                    datasource.setPluginId(tuple.getT2().getId());
                    datasource.setDatasourceConfiguration(new DatasourceConfiguration());

                    ActionDTO action = new ActionDTO();
                    action.setName("onPageLoadAction");
                    action.setPageId(application.getPages().get(0).getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    DefaultResources branchedResources = new DefaultResources();
                    branchedResources.setActionId("branchedActionId");
                    branchedResources.setApplicationId("branchedAppId");
                    branchedResources.setPageId("branchedPageId");
                    branchedResources.setCollectionId("branchedCollectionId");
                    branchedResources.setBranchName("testBranch");
                    action.setDefaultResources(branchedResources);

                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject parentDsl = null;
                    try {
                        parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
                        }));
                    } catch (JsonProcessingException e) {
                        log.debug(String.valueOf(e));
                    }

                    ArrayList children = (ArrayList) parentDsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
                    testWidget.put("dynamicBindingPathList", temp);
                    testWidget.put("testField", "{{ onPageLoadAction.data }}");
                    children.add(testWidget);

                    Layout layout = testPage.getLayouts().get(0);
                    layout.setDsl(parentDsl);

                    // Save actionCollection
                    ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                    actionCollectionDTO.setName("testCollection1");
                    actionCollectionDTO.setPageId(application.getPages().get(0).getId());
                    actionCollectionDTO.setApplicationId(application.getId());
                    actionCollectionDTO.setOrganizationId(application.getOrganizationId());
                    actionCollectionDTO.setPluginId(datasource.getPluginId());
                    actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
                    actionCollectionDTO.setBody("collectionBody");
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("testAction1");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration().setBody("mockBody");
                    actionCollectionDTO.setActions(List.of(action1));
                    actionCollectionDTO.setPluginType(PluginType.JS);
                    actionCollectionDTO.setDefaultResources(branchedResources);
                    actionCollectionDTO.setDefaultToBranchedActionIdsMap(Map.of("branchedId", "collectionId"));

                    return Mono.zip(
                            layoutActionService.createSingleAction(action)
                                    .then(layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout)),
                            layoutCollectionService.createCollection(actionCollectionDTO)
                    )
                    .map(tuple2 -> application);
                });

        Mono<Application> resultMono = applicationMono
                .flatMap(application -> gitDataService.detachRemote(application.getId()));

        StepVerifier
                .create(resultMono.zipWhen(application -> Mono.zip(
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList()
                )))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    assertThat(application.getGitApplicationMetadata()).isNull();
                    application.getPages().forEach(page -> assertThat(page.getDefaultPageId()).isEqualTo(page.getId()));
                    application.getPublishedPages().forEach(page -> assertThat(page.getDefaultPageId()).isEqualTo(page.getId()));

                    assertThat(pageList).isNotNull();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getDefaultResources()).isNotNull();
                        assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                        assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(application.getId());
                        assertThat(newPage.getDefaultResources().getBranchName()).isNullOrEmpty();

                        newPage.getUnpublishedPage()
                                .getLayouts()
                                .forEach(layout ->
                                        layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                            dslActionDTOS.forEach(actionDTO -> {
                                                Assertions.assertThat(actionDTO.getId()).isEqualTo(actionDTO.getDefaultActionId());
                                            });
                                        })
                                );
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(application.getId());
                        assertThat(newAction.getDefaultResources().getBranchName()).isNullOrEmpty();

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources()).isNotNull();
                        assertThat(action.getDefaultResources().getPageId()).isEqualTo(application.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            assertThat(action.getDefaultResources().getCollectionId()).isEqualTo(action.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources()).isNotNull();
                        assertThat(actionCollection.getDefaultResources().getCollectionId()).isEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getDefaultResources().getApplicationId()).isEqualTo(application.getId());
                        assertThat(actionCollection.getDefaultResources().getBranchName()).isNullOrEmpty();

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        assertThat(unpublishedCollection.getDefaultToBranchedActionIdsMap())
                                .hasSize(1);
                        unpublishedCollection.getDefaultToBranchedActionIdsMap().keySet()
                                .forEach(key ->
                                        assertThat(key).isEqualTo(unpublishedCollection.getDefaultToBranchedActionIdsMap().get(key))
                                );

                        assertThat(unpublishedCollection.getDefaultResources()).isNotNull();
                        assertThat(unpublishedCollection.getDefaultResources().getPageId())
                                .isEqualTo(application.getPages().get(0).getId());
                    });

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void detachRemote_EmptyGitData_NoChange() {
        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("detachRemote_EmptyGitData");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mono<Application> applicationMono = gitDataService.detachRemote(application1.getId());

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException & throwable.getMessage().contains("Git configuration is invalid"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_EmptyRepo_DefaultBranch() throws IOException {
        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("defaultBranch");
        branchList.add(gitBranchDTO);

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), eq(false)))
                .thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeGitRepo(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("listBranchForApplication_EmptyRepo_DefaultBranch");
        testApplication.setOrganizationId(orgId);

        Application application1 = createApplicationConnectedToGit("listBranchForApplication_EmptyRepo_DefaultBranch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Application applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl").block();

        Mono<List<GitBranchDTO>> listMono = gitDataService.listBranchForApplication(application1.getId(), false);

        StepVerifier
                .create(listMono)
                .assertNext(listBranch -> {
                    assertThat(listBranch).isNotNull();
                    assertThat(listBranch.stream().count()).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_NonEmptyRepo_ListBranch() throws IOException {
        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("defaultBranch");
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/defaultBranch");
        branchList.add(gitBranchDTO);

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), eq(false)))
                .thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeGitRepo(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("listBranchForApplication_NonEmptyRepo");
        testApplication.setOrganizationId(orgId);

        Application application1 = createApplicationConnectedToGit("listBranchForApplication_NonEmptyRepo_ListBranch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        //Application applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl").block();

        Mono<List<GitBranchDTO>> listMono = gitDataService.listBranchForApplication(application1.getId(), false);

        StepVerifier
                .create(listMono)
                .assertNext(listBranch -> {
                    assertThat(listBranch).isNotNull();
                    assertThat(listBranch.stream().count()).isEqualTo(2);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_EmptyGitMetadata_ThrowError() {
        List<String> branchList = new ArrayList<>();
        branchList.add("defaultBranch");
        branchList.add("origin/defaultBranch");
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("validData_WithNonEmptyPublishedPages");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mono<List<GitBranchDTO>> listMono = gitDataService.listBranchForApplication(application1.getId(), false);

        StepVerifier
                .create(listMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("Unable to find default application. Please configure the application with git"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_GitFailure_ThrowError() throws IOException {
        List<String> branchList = new ArrayList<>();
        branchList.add("defaultBranch");
        branchList.add("origin/defaultBranch");
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeGitRepo(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("listBranchForApplication_GitFailure_ThrowError");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mono<List<GitBranchDTO>> listMono = gitDataService.listBranchForApplication(application1.getId(), false);

        StepVerifier
                .create(listMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("Git configuration is invalid. Details: Unable to find default application. Please configure the application with git"))
                .verify();
    }

    private Application createApplicationConnectedToGit(String name) throws IOException {

        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));

        User user = new User();
        user.setId("userId");

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                Mockito.any(Path.class),
                Mockito.any(),
                Mockito.any(),
                Mockito.any(),
                Mockito.any())
        )
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeGitRepo(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(importExportApplicationService.exportApplicationById(Mockito.anyString(), Mockito.any(SerialiseApplicationObjective.class)))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(user));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.getForUser(Mockito.anyString())).thenReturn(Mono.just(userData));
        Mockito.when(userDataService.updateForUser(Mockito.any(), Mockito.any())).thenReturn(Mono.just(userData));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        testApplication.setName(name);
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRemoteUrl("test.com");
        gitApplicationMetadata.setDefaultBranchName("defaultBranchName");
        gitApplicationMetadata.setBranchName("defaultBranch");
        gitApplicationMetadata.setDefaultApplicationId(application1.getId());
        gitApplicationMetadata.setRepoName("testRepo");
        application1.setGitApplicationMetadata(gitApplicationMetadata);
        application1 = applicationService.save(application1).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application1));

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        return gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl").block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_ChangesInRemote_SuccessMessage() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("NoChangesInRemote");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("2 commits pulled");
        mergeStatusDTO.setMergeAble(true);

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(2);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(gitFileUtils.reconstructApplicationFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(new ApplicationJson()));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.getStatus(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(true)))
                .thenReturn(Mono.just("fetched"));
        Mockito.when(importExportApplicationService.exportApplicationById(Mockito.anyString(), Mockito.any(SerialiseApplicationObjective.class)))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(importExportApplicationService.importApplicationInOrganization(Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application));

        Mono<GitPullDTO> applicationMono = gitDataService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getMergeStatus().getStatus()).isEqualTo("2 commits pulled");
                    assertThat(gitPullDTO.getApplication()).isNotNull();
                    assertThat(gitPullDTO.getApplication().getId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_FileSystemAccessError_ShowError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("FileSystemAccessError");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("2 commits pulled");
        mergeStatusDTO.setMergeAble(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenThrow(new IOException("Error accessing the file System"));
        Mockito.when(gitFileUtils.reconstructApplicationFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(new ApplicationJson()));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(importExportApplicationService.exportApplicationById(Mockito.anyString(), Mockito.any(SerialiseApplicationObjective.class)))
                .thenReturn(Mono.just(new ApplicationJson()));

        Mono<GitPullDTO> applicationMono = gitDataService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("Error accessing the file System"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_NoChangesInRemotePullException_ShowError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("pullChanges_NoChangesInRemotePullException_ShowError");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("Nothing to fetch from remote. All changes are upto date.");
        mergeStatusDTO.setMergeAble(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.reconstructApplicationFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.justOrEmpty(new ApplicationJson()));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new GitStatusDTO()));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));

        Mono<GitPullDTO> applicationMono = gitDataService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getMergeStatus().getStatus()).isEqualTo("Nothing to fetch from remote. All changes are upto date.");
                })
                .verifyComplete();
    }

    // TODO TCs for merge and merge status needs to be re-written to address all the scenarios
    @Test
    @WithUserDetails(value = "api_user")
    public void isMergeBranch_ConflictingChanges_Success() throws IOException, GitAPIException {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));

        Application application = createApplication("isMergeBranch_ConflictingChanges", "defaultBranch");
        Application application1 = createApplication("isMergeBranch_ConflictingChanges_branch", "branch2");
        GitApplicationMetadata gitApplicationMetadata = application1.getGitApplicationMetadata();
        gitApplicationMetadata.setDefaultApplicationId(application.getId());
        application1.setGitApplicationMetadata(gitApplicationMetadata);
        applicationService.save(application1).block();

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch("branch2");
        gitMergeDTO.setDestinationBranch("defaultBranch");

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new GitStatusDTO()));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));

        Mono<MergeStatusDTO> applicationMono = gitDataService.isBranchMergeable(application.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> assertThat(s.isMergeAble()))
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isMergeBranch_NonConflictingChanges_Success() throws IOException, GitAPIException {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));

        Application application = createApplication("isMergeBranch_NonConflictingChanges_Success", "defaultBranch");
        Application application1 = createApplication("isMergeBranch_NonConflictingChanges_Success_branch", "branch2");

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch("branch2");
        gitMergeDTO.setDestinationBranch("defaultBranch");

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new GitStatusDTO()));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));

        Mono<MergeStatusDTO> applicationMono = gitDataService.isBranchMergeable(application.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> assertThat(!s.isMergeAble()))
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isMergeBranch_mergeConflictError_Success() throws IOException, GitAPIException {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));

        Application application = createApplication("isMergeBranch_mergeConflictError_Success", "defaultBranch");
        Application application1 = createApplication("isMergeBranch_mergeConflictError_Success_branch", "branch2");

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch("branch2");
        gitMergeDTO.setDestinationBranch("defaultBranch");

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new GitStatusDTO()));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));

        Mono<MergeStatusDTO> applicationMono = gitDataService.isBranchMergeable(application.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> assertThat(!s.isMergeAble()))
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isMergeBranch_remoteAhead_failure() throws IOException, GitAPIException {
        UserData userData = new UserData();
        GitProfile gitProfile1 = new GitProfile();
        gitProfile1.setAuthorEmail("test@test.com");
        gitProfile1.setAuthorName("test");
        userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT_GIT_PROFILE, gitProfile1));

        Application application = createApplication("isMergeBranch_remoteAhead_failure", "defaultBranch");
        Application application1 = createApplication("isMergeBranch_remoteAhead_failure_branch", "branch2");
        GitApplicationMetadata gitApplicationMetadata = application1.getGitApplicationMetadata();
        gitApplicationMetadata.setDefaultApplicationId(application.getId());
        application1.setGitApplicationMetadata(gitApplicationMetadata);
        applicationService.save(application1).block();

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch("branch2");
        gitMergeDTO.setDestinationBranch("defaultBranch");

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(2);

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(importExportApplicationService.importApplicationInOrganization(
                Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(application));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));

        Mono<MergeStatusDTO> applicationMono = gitDataService.isBranchMergeable(application.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> assertThat(!s.isMergeAble()))
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isMergeBranch_remoteBranch_Error() {
        Application application = createApplication("isMergeBranch_remoteBranch_Error", "defaultBranch");

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch("origin/branch2");
        gitMergeDTO.setDestinationBranch("defaultBranch");

        Mono<MergeStatusDTO> applicationMono = gitDataService.isBranchMergeable(application.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException && throwable.getMessage().contains("origin/branch2"))
                .verify();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkoutRemoteBranch_NotPresentInLocal_NewChildApplicationCreated() throws GitAPIException, IOException {
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setRepoName("testRepo");
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("privateKey");
        gitAuth.setPrivateKey("privateKey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setBranchName("testRemote");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("checkoutRemoteBranch_NotPresentInLocal_main");
        testApplication.setOrganizationId(orgId);
        Application application = applicationPageService.createApplication(testApplication).block();

        application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
        applicationService.save(application).block();

        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("newBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(new ApplicationJson()));
        Mockito.when(importExportApplicationService.importApplicationInOrganization(Mockito.anyString(), Mockito.any(ApplicationJson.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(new Application()));

        Mono<Application> applicationMono = gitDataService.checkoutBranch(application.getId(), "testRemote")
                .flatMap(application1 -> applicationService.findByBranchNameAndDefaultApplicationId("testRemote", application.getId(), AclPermission.READ_APPLICATIONS));

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getGitApplicationMetadata().getBranchName()).isEqualTo("testRemote");
                    assertThat(application1.getGitApplicationMetadata().getDefaultApplicationId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkoutRemoteBranch_PresentInLocal_CheckedOutToExistingApplication() {
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setRepoName("testRepo");
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("privateKey");
        gitAuth.setPrivateKey("privateKey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setBranchName("testRemote");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("checkoutRemoteBranch_main");
        testApplication.setOrganizationId(orgId);
        Application application = applicationPageService.createApplication(testApplication).block();

        Application testApplication1 = new Application();
        testApplication1.setName("checkoutRemoteBranch_testRemoteBranch");
        testApplication1.setOrganizationId(orgId);
        GitApplicationMetadata gitApplicationMetadata1 = new GitApplicationMetadata();
        gitAuth = new GitAuth();
        gitAuth.setPublicKey("privateKey");
        gitAuth.setPrivateKey("privateKey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setBranchName("testRemote");
        gitApplicationMetadata1.setDefaultApplicationId(application.getId());
        gitApplicationMetadata1.setBranchName("testRemoteBranch");
        testApplication1.setGitApplicationMetadata(gitApplicationMetadata1);
        Application application2 = applicationPageService.createApplication(testApplication1).block();

        Mono<Application> applicationMono = gitDataService.checkoutBranch(application.getId(), "testRemoteBranch");

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getName()).isEqualTo(application2.getName());
                })
                .verifyComplete();
    }

    // TODO pending TCs
    // Commit, Push, Commit History, Merge, isMergeable
}