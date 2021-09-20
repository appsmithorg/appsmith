package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
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

import java.util.Map;

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
    public void connectApplicationToGit_validGitMetadata_Success() {
        GitProfile gitProfile = getConfigRequest("test@appsmith.com", "Test 1");
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("ValidTest TestApp");
        Application application1 = applicationService.createDefault(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("test.url.git", gitProfile);
        Mono<Application> applicationMono = gitDataService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("master");
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
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
}