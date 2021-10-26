package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchListDTO;
import com.appsmith.external.dtos.MergeStatus;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
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

    @MockBean
    UserService userService;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
    GitFileUtils gitFileUtils;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

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

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_gitConfigValues_SaveToUserObject() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitProfile gitGlobalConfigDTO = getConfigRequest("test@appsmith.com", "Test 1");
        Mono<Map<String, GitProfile>> gitProfilesMono = gitDataService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);

        StepVerifier
                .create(gitProfilesMono)
                .assertNext(gitProfileMap -> {
                    GitProfile defaultProfile = gitProfileMap.get(DEFAULT_GIT_PROFILE);
                    assertThat(defaultProfile.getAuthorName()).isEqualTo(gitGlobalConfigDTO.getAuthorName());
                    assertThat(defaultProfile.getAuthorEmail()).isEqualTo(gitGlobalConfigDTO.getAuthorEmail());
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_AuthorEmailNull_ThrowInvalidParameterError() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitProfile gitGlobalConfigDTO = getConfigRequest(null, "Test 1");

        Mono<Map<String, GitProfile>> userDataMono = gitDataService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);
        StepVerifier
                .create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Email")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_AuthorNameEmptyString_ThrowInvalidParameterError() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitProfile gitGlobalConfigDTO = getConfigRequest("test@appsmith.com", null);

        Mono<Map<String, GitProfile>> userDataMono = gitDataService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);
        StepVerifier
                .create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Name")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getConfig_ValueExistsInDB_Success() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitProfile gitGlobalConfigDTO = getConfigRequest("test@appsmith.com", "Test 1");
        Map<String, GitProfile> userData = gitDataService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO).block();
        Mono<GitProfile> gitConfigMono = gitDataService.getGitProfileForUser();

        StepVerifier
                .create(gitConfigMono)
                .assertNext(configData -> {
                    assertThat(configData.getAuthorName()).isEqualTo(gitGlobalConfigDTO.getAuthorName());
                    assertThat(configData.getAuthorEmail()).isEqualTo(gitGlobalConfigDTO.getAuthorEmail());
                });
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
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        testApplication.setName("InvalidGitApplicationMetadata");
        testApplication.setOrganizationId(orgId);
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
    public void connectApplicationToGit_EmptyPrivateKey_ThrowInvalidGitConfigurationException() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
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
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
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

/*    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidRemoteUrl_ThrowInvalidRemoteUrl() throws GitAPIException, IOException {

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));

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
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("remote url")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidPrivateKey_ThrowInvalidGitConfigurationException() throws GitAPIException, IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("InvalidPrivateKey");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.AUTHENTICATION_FAILURE.getMessage("SSH Key is not configured properly. Can you please try again by reconfiguring the SSH key")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidPublicKey_ThrowInvalidGitConfigurationException() throws GitAPIException, IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));

        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("InvalidPublicKey");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.AUTHENTICATION_FAILURE.getMessage("SSH Key is not configured properly. Can you please try again by reconfiguring the SSH key")))
                .verify();
    }*/

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidFilePath_ThrowIOException() throws IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenThrow(new IOException("Invalid repo"));

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

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INTERNAL_SERVER_ERROR.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_ClonedRepoNotEmpty_Failure() throws IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
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
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
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
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("validData_WithEmptyPublishedPages");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchName");
                    assertThat(gitApplicationMetadata1.getGitAuth().getPrivateKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getGeneratedAt()).isNotNull();
                    assertThat(gitApplicationMetadata1.getDefaultApplicationId()).isEqualTo(application1.getId());
                    assertThat(gitApplicationMetadata1.getRepoName()).isEqualTo("testRepo");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithNonEmptyPublishedPages_CloneSuccess() throws IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
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
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("connectApplicationToGit_WithNonEmptyPublishedPages");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchName");
                    assertThat(gitApplicationMetadata1.getGitAuth().getPrivateKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getGeneratedAt()).isNotNull();
                    assertThat(gitApplicationMetadata1.getDefaultApplicationId()).isEqualTo(application1.getId());
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
        Mockito.when(gitFileUtils.detachRemote(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRepoName("repoName");
        gitApplicationMetadata.setDefaultApplicationId("TestId");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("detachRemote_validData");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mono<Application> applicationMono = gitDataService.detachRemote(application1.getId());

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata()).isNull();
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
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_EmptyRepo_DefaultBranch() throws IOException {
        List<GitBranchListDTO> branchList = new ArrayList<>();
        GitBranchListDTO gitBranchListDTO = new GitBranchListDTO();
        gitBranchListDTO.setBranchName("defaultBranch");
        branchList.add(gitBranchListDTO);

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), eq(null), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
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
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("listBranchForApplication_EmptyRepo_DefaultBranch");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Application applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl").block();

        Mono<List<GitBranchListDTO>> listMono = gitDataService.listBranchForApplication(application1.getId());

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
        List<GitBranchListDTO> branchList = new ArrayList<>();
        GitBranchListDTO gitBranchListDTO = new GitBranchListDTO();
        gitBranchListDTO.setBranchName("defaultBranch");
        branchList.add(gitBranchListDTO);
        gitBranchListDTO = new GitBranchListDTO();
        gitBranchListDTO.setBranchName("origin/defaultBranch");
        branchList.add(gitBranchListDTO);

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), eq(null), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
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
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("listBranchForApplication_NonEmptyRepo");
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Application applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl").block();

        Mono<List<GitBranchListDTO>> listMono = gitDataService.listBranchForApplication(application1.getId());

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

        Mono<List<GitBranchListDTO>> listMono = gitDataService.listBranchForApplication(application1.getId());

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

        Mono<List<GitBranchListDTO>> listMono = gitDataService.listBranchForApplication(application1.getId());

        StepVerifier
                .create(listMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("Git configuration is invalid. Details: Unable to find default application. Please configure the application with git"))
                .verify();
    }

    private Application createApplicationConnectedToGit(String name) throws IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
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
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName(name);
        testApplication.setOrganizationId(orgId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        return gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl").block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_ChangesInRemote_SuccessMessage() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("NoChangesInRemote");
        ApplicationJson applicationJson = importExportApplicationService.exportApplicationById(application.getId()).block();

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.reconstructApplicationFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.justOrEmpty(applicationJson));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("2 commits pulled"));

        Mono<GitPullDTO> applicationMono = gitDataService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getPullStatus()).isEqualTo("2 commits pulled");
                    assertThat(gitPullDTO.getApplication()).isNotNull();
                    assertThat(gitPullDTO.getApplication().getId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_FileSystemAccessError_ShowError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("FileSystemAccessError");
        ApplicationJson applicationJson = importExportApplicationService.exportApplicationById(application.getId()).block();

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenThrow(new IOException("Error accessing the file System"));
        Mockito.when(gitFileUtils.reconstructApplicationFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.justOrEmpty(applicationJson));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("2 commits pulled"));

        Mono<GitPullDTO> applicationMono = gitDataService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains(AppsmithError.GIT_ACTION_FAILED.getMessage("pull","Error accessing the file System")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_NoChangesInRemotePullException_ShowError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("pullChanges_NoChangesInRemotePullException_ShowError");
        ApplicationJson applicationJson = importExportApplicationService.exportApplicationById(application.getId()).block();

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.reconstructApplicationFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.justOrEmpty(applicationJson));

        Mono<GitPullDTO> applicationMono = gitDataService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getPullStatus()).isEqualTo("Nothing to fetch from remote. All changes are upto date.");
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_HydrateApplicationToFileSystem_ShowError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("NoChangesInRemotePullException");
        ApplicationJson applicationJson = importExportApplicationService.exportApplicationById(application.getId()).block();

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.reconstructApplicationFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.justOrEmpty(applicationJson));

        Mono<GitPullDTO> applicationMono = gitDataService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getPullStatus()).isEqualTo("Nothing to fetch from remote. All changes are upto date.");
                });
    }


    /*
    * Dehydrate application - exception
    * git pull exception - Nothing to fetch, normal error
    *
    * getGitApplicationMetadata
    *
    * merge
    * */

    @Test
    @WithUserDetails(value = "api_user")
    public void isMergeBranch_ConflictingChanges_Success() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("isMergeBranch_ConflictingChanges_Success");
        MergeStatus mergeStatus = new MergeStatus();
        mergeStatus.setMerge(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));

        Mono<MergeStatus> applicationMono = gitDataService.isBranchMergeable(application.getId(), "branch1","branch2");

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> assertThat(s.isMerge()));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isMergeBranch_NonConflictingChanges_Success() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("isMergeBranch_NonConflictingChanges_Success");
        MergeStatus mergeStatus = new MergeStatus();
        mergeStatus.setMerge(true);
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));

        Mono<MergeStatus> applicationMono = gitDataService.isBranchMergeable(application.getId(), "branch1","branch2");

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> assertThat(s.isMerge()));
    }
}