package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
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

    //TO-DO:use the value from env variable
    private final String path = "/Users/anaghhegde/workspace/project/";

    String orgId = "";

    String url = "https://github.com/AnaghHegde/Enigma-Reborn.git";

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg == null ? "" : testOrg.getId();
    }

    private GitGlobalConfigDTO getConnectRequest(String url, String userName, String password, String sshKey, boolean isSshKey, String profileName) {
        GitGlobalConfigDTO gitGlobalConfigDTO = new GitGlobalConfigDTO();
        gitGlobalConfigDTO.setUserEmail(userName);
        gitGlobalConfigDTO.setPassword(password);
        gitGlobalConfigDTO.setRemoteUrl(url);
        gitGlobalConfigDTO.setOrganizationId(orgId);
        gitGlobalConfigDTO.setProfileName(profileName);
        return gitGlobalConfigDTO;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_gitConfigValues_SaveToUserObject() {
        Mockito.when(userService.findByEmail(Mockito.anyString())).thenReturn(Mono.just(new User()));
        GitGlobalConfigDTO gitGlobalConfigDTO = getConnectRequest(url,"", "", "", false, "test1");
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
        GitGlobalConfigDTO gitGlobalConfigDTO = getConnectRequest(url,"anagh@appsmith.com", "Test123", "", false, "test2");
        Mono<UserData> userDataMono = gitDataService.saveGitConfigData(gitGlobalConfigDTO);

        StepVerifier
                .create(userDataMono)
                .assertNext(userData -> {
                    assertThat(userData.getGitLocalConfigData().contains(gitGlobalConfigDTO));
                });
    }

}