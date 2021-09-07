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
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.BeforeEach;
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

    private GitAuth getGitAuth() {
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("privateKey");
        gitAuth.setPublicKey("publicKey");
        return gitAuth;
    }

    private GitConnectDTO getConnectRequest(String remoteUrl,
                                            String applicationId,
                                            GitAuth gitAuth,
                                            String authorName,
                                            String authorEmail,
                                            String organizationId) {
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(remoteUrl);
        gitConnectDTO.setApplicationId(applicationId);
        gitConnectDTO.setGitAuth(gitAuth);
        gitConnectDTO.setAuthorName(authorName);
        gitConnectDTO.setAuthorEmail(authorEmail);
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
                        && throwable.getMessage().contains("Please enter a valid parameter Author Email ."))
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
                        && throwable.getMessage().contains("Please enter a valid parameter Author Name ."))
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
        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", "testID", getGitAuth(),
                null, null, orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata.getAuthorEmail()).isNull();
                    assertThat(gitApplicationMetadata.getAuthorName()).isNull();
                    assertThat(gitApplicationMetadata.getBranchName()).isEqualTo("master");
                    assertThat(gitApplicationMetadata.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithCustomUserConfig_Success() {
        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", "testID", getGitAuth(),
                "test", "test@appsmith.com", orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata.getAuthorEmail()).isEqualTo(gitConnectDTO.getAuthorEmail());
                    assertThat(gitApplicationMetadata.getAuthorName()).isEqualTo(gitConnectDTO.getAuthorName());
                    assertThat(gitApplicationMetadata.getBranchName()).isEqualTo("master");
                    assertThat(gitApplicationMetadata.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata.getDefaultApplicationId()).isEqualTo(gitConnectDTO.getApplicationId());
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyGitAuth_ThrowInvalidParameterException() {
        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", "testID", new GitAuth(),
                "test", "test@appsmith.com", orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("SSH Key", "")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyPublicSshKey_ThrowInvalidParameterException() {
        GitAuth gitAuth = getGitAuth();
        gitAuth.setPublicKey(null);
        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", "testID", gitAuth,
                "test", "test@appsmith.com", orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("SSH Key", "")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyPrivateSshKey_ThrowInvalidParameterException() {
        GitAuth gitAuth = getGitAuth();
        gitAuth.setPrivateKey(null);
        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", "testID", gitAuth,
                "test", "test@appsmith.com", orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("SSH Key", "")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyRemoteUrl_ThrowInvalidParameterException() {
        GitConnectDTO gitConnectDTO = getConnectRequest(null, "testID", getGitAuth(),
                "test", "test@appsmith.com", orgId);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Remote Url", "")))
                .verify();
    }
}