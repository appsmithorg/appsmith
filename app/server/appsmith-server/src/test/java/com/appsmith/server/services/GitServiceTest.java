package com.appsmith.server.services;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
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
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

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
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @MockBean
    UserService userService;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
    GitFileUtils gitFileUtils;

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
        GitProfile gitGlobalConfigDTO = getConfigRequest("test@appsmith.com",  null);

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

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidRemoteUrl_ThrowInvalidRemoteUrl() throws GitAPIException, IOException {

        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenThrow(new InvalidRemoteException("Invalid PrivateKey"));

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
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenThrow(new TransportException("Invalid PrivateKey"));

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
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenThrow(new TransportException("Invalid public"));

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
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidFilePath_ThrowIOException() throws GitAPIException, IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenThrow(new IOException("File does not exist in the path"));

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
    public void connectApplicationToGit_ClonedRepoNotEmpty_Failure() throws GitAPIException, IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn("defaultBranchName");
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(false);

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
    public void connectApplicationToGit_WithEmptyPublishedPages_CloneSuccess() throws GitAPIException, IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn("defaultBranchName");
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(true);
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
    public void connectApplicationToGit_WithNonEmptyPublishedPages_CloneSuccess() throws GitAPIException, IOException {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn("defaultBranchName");
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(true);
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
        testApplication.setName("validData_WithNonEmptyPublishedPages");
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

}