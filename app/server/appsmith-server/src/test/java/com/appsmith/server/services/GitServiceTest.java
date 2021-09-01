package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
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
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class GitServiceTest {

    @Autowired
    private GitService gitDataService;

    @Autowired
    OrganizationRepository organizationRepository;

    @MockBean
    UserService userService;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
    }

    private GitConfig getConnectRequest(String url, String userName, String commitEmail, String password, String sshKey, boolean isSshKey, String profileName) {
        GitConfig gitConfig = new GitConfig();
        gitConfig.setUserName(userName);
        gitConfig.setCommitEmail(commitEmail);
        gitConfig.setPassword(password);
        gitConfig.setRemoteUrl(url);
        gitConfig.setProfileName(profileName);
        return gitConfig;
    }



    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_gitConfigValues_SaveToUserObject() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("https://github.com/AnaghHegde/Enigma-Reborn.git",
                "anagh@appsmith.com", "anagh@appsmith.com",
                "", "", false, "test1");
        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);

        StepVerifier
                .create(userDataMono)
                .assertNext(userData -> {
                    assertThat(userData.getGitLocalConfigData().contains(gitGlobalConfigDTO));
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_gitConfigValues_updateUserObject() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("test.url","anagh@appsmith.com","anagh@appsmith.com",
                "Test123", "", false, "test2");
        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);

        StepVerifier
                .create(userDataMono)
                .assertNext(userData -> {
                    assertThat(userData.getGitLocalConfigData().contains(gitGlobalConfigDTO));
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_DuplicateProfileName_ThrowDuplicateKeyError() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("test.url","anagh@appsmith.com","anagh@appsmith.com",
                "Test123", "", false, "test2");
        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO)
                .flatMap( userData -> gitDataService.saveGitConfigData(gitGlobalConfigDTO));

        StepVerifier
                .create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Profile Name -test2 already exists. Please use a different Profile Name."))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_ProfileNameNull_ThrowInvalidParameterError() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("test.url","anagh@appsmith.com","anagh@appsmith.com",
                "Test123", "", false, "");

        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);
        StepVerifier
                .create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Please enter a valid parameter Profile Name."))
                .verify();
    }

}