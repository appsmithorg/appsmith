package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
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

    @SpyBean
    SessionUserService sessionUserService;

    String orgId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg.getId();
    }

    private GitConfig getConfigRequest( String commitEmail, String author) {
        GitConfig gitConfig = new GitConfig();
        gitConfig.setAuthorEmail(commitEmail);
        gitConfig.setAuthorName(author);
        return gitConfig;
    }

    private GitConnectDTO getConnectRequest(String remoteUrl,
                                            String applicationId,
                                            String organizationId) {
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(remoteUrl);
        gitConnectDTO.setApplicationId(applicationId);
        gitConnectDTO.setOrganizationId(organizationId);
        return gitConnectDTO;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_gitConfigValues_SaveToUserObject() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConfigRequest("test@appsmith.com", "Test 1");
        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);

        StepVerifier
                .create(userDataMono)
                .assertNext(userData -> {
                    assertThat(userData.getGitGlobalConfigData().getAuthorName()).isEqualTo(gitGlobalConfigDTO.getAuthorName());
                    assertThat(userData.getGitGlobalConfigData().getAuthorEmail()).isEqualTo(gitGlobalConfigDTO.getAuthorEmail());
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_gitConfigValues_updateUserObject() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConfigRequest("test@appsmith.com", "Test 1");
        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);

        StepVerifier
                .create(userDataMono)
                .assertNext(userData -> {
                    assertThat(userData.getGitGlobalConfigData().getAuthorName()).isEqualTo(gitGlobalConfigDTO.getAuthorName());
                    assertThat(userData.getGitGlobalConfigData().getAuthorEmail()).isEqualTo(gitGlobalConfigDTO.getAuthorEmail());
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_AuthorEmailNull_ThrowInvalidParameterError() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConfigRequest(null, "Test 1");

        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);
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
        GitConfig gitGlobalConfigDTO = getConfigRequest("test@appsmith.com",  null);

        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);
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
        GitConfig gitGlobalConfigDTO = getConfigRequest("test@appsmith.com", "Test 1");
        UserData userData = gitDataService.saveGitConfigData(gitGlobalConfigDTO).block();
        Mono<GitConfig> gitConfigMono = gitDataService.getGitConfigForUser();

        StepVerifier
                .create(gitConfigMono)
                .assertNext(configData -> {
                    assertThat(configData.getAuthorName()).isEqualTo(gitGlobalConfigDTO.getAuthorName());
                    assertThat(configData.getAuthorEmail()).isEqualTo(gitGlobalConfigDTO.getAuthorEmail());
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_validGitMetadata_Success() {
        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", "testID", orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata.getBranchName()).isEqualTo("master");
                    assertThat(gitApplicationMetadata.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyGitMetadata_ThrowInvalidParameterException() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest TestApp");
        Application application = applicationPageService.createApplication(testApplication, orgId).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", application.getId(), orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(
                                AppsmithError.INVALID_PARAMETER.getMessage("SSH Key is empty. Please reach out to Appsmith support")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyGitAuth_ThrowInvalidParameterException() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTestApp");
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        Application application = applicationPageService.createApplication(testApplication, orgId).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", application.getId(), orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(
                        AppsmithError.INVALID_PARAMETER.getMessage("SSH Key is empty. Please reach out to Appsmith support")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyPrivateSshKey_ThrowInvalidParameterException() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationService TestApp");
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        Application application = applicationPageService.createApplication(testApplication, orgId).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", application.getId(), orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(
                        AppsmithError.INVALID_PARAMETER.getMessage("SSH Key is empty. Please reach out to Appsmith support")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyRemoteUrl_ThrowInvalidParameterException() {
        GitConnectDTO gitConnectDTO = getConnectRequest(null, "testID", orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Remote Url")))
                .verify();
    }
}