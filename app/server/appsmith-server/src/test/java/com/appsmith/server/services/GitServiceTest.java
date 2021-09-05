package com.appsmith.server.services;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
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

    private GitConfig getConnectRequest( String commitEmail, String profileName, String author) {
        GitConfig gitConfig = new GitConfig();
        gitConfig.setAuthorEmail(commitEmail);
        gitConfig.setProfileName(profileName);
        gitConfig.setAuthor(author);
        return gitConfig;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_gitConfigValues_SaveToUserObject() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("test@appsmith.com",
                "Test 1", "Test 1");
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
        GitConfig gitGlobalConfigDTO = getConnectRequest("test@appsmith.com",
                "Test 1", "Test 1");
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
        GitConfig gitGlobalConfigDTO = getConnectRequest("test@appsmith.com",
                "Test 1", "Test 1");
        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO)
                .flatMap(userData -> gitDataService.saveGitConfigData(gitGlobalConfigDTO));

        StepVerifier
                .create(userDataMono)
                .assertNext(userData -> {
                    assertThat(userData.getGitLocalConfigData()).isNotNull();
                });

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_ProfileNameNull_ThrowInvalidParameterError() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("test@appsmith.com",
                null, "Test 1");

        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);
        StepVerifier
                .create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Please enter a valid parameter Profile Name."))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_ProfileNameEmptyString_ThrowInvalidParameterError() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("test@appsmith.com",
                "", "Test 1");

        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);
        StepVerifier
                .create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Please enter a valid parameter Profile Name."))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateConfig_ValidProfileName_Success() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("test@appsmith.com",
                "Test 1", "Test 1");

        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO)
                .flatMap(userData -> {
                    gitGlobalConfigDTO.setAuthor("Test");
                    return gitDataService.updateGitConfigData(gitGlobalConfigDTO);
                });

        StepVerifier
                .create(userDataMono)
                .assertNext(userData -> {
                   assertThat(userData.getGitLocalConfigData().contains(gitGlobalConfigDTO));
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateConfig_InValidProfileName_NoUpdate() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitConfig gitGlobalConfigDTO = getConnectRequest("test@appsmith.com",
                "Test 1", "Test 1");

        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO)
                .flatMap(userData -> {
                    gitGlobalConfigDTO.setAuthor("Test");
                    gitGlobalConfigDTO.setProfileName("Test");
                    return gitDataService.updateGitConfigData(gitGlobalConfigDTO);
                });

        StepVerifier
                .create(userDataMono)
                .assertNext(userData -> {
                    assertThat(userData.getGitLocalConfigData().contains(gitGlobalConfigDTO)).isFalse();
                });
    }

}