package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.TransportException;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.Assertions;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;

import java.io.IOException;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class GitServiceTest {

    @Autowired
    private GitDataService gitDataService;

    @Autowired
    OrganizationRepository organizationRepository;

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

    private GitGlobalConfigDTO getConnectRequest(String url, String userName, String password, String sshKey, boolean isSshKey) {
        GitGlobalConfigDTO gitGlobalConfigDTO = new GitGlobalConfigDTO();
        gitGlobalConfigDTO.setUserEmail(userName);
        gitGlobalConfigDTO.setPassword(password);
        gitGlobalConfigDTO.setRemoteUrl(url);
        gitGlobalConfigDTO.setOrganizationId(orgId);
        return gitGlobalConfigDTO;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void  cloneRepo_validRemote_cloneSucess() throws IOException {
        GitGlobalConfigDTO gitGlobalConfigDTO = getConnectRequest(url, "", "", "", false);
        String response = gitDataService.connectToGitRepo(gitGlobalConfigDTO);
        assertThat(response.contains("/.git"));
    }

    @Test(expected = TransportException.class)
    @WithUserDetails(value = "api_user")
    public void  cloneRepo_inaValidRemote_ThrowsGitAPIException() throws IOException {
        GitGlobalConfigDTO gitGlobalConfigDTO = getConnectRequest("url" + url, "", "", "", false);
        TransportException exception = assertThrows(TransportException.class,
                ()-> gitDataService.connectToGitRepo(gitGlobalConfigDTO));
        assertThat(exception.getMessage()).contains("remote hung up unexpectedly");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneRepo_directoryDoesntExists_Success() throws IOException {
        orgId = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block().getId();
        GitGlobalConfigDTO gitGlobalConfigDTO = getConnectRequest("url" + url, "", "", "", false);
        String response = gitDataService.connectToGitRepo(gitGlobalConfigDTO);
        assertThat(response.contains("/.git"));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneRepo_duplicateName_Success() throws IOException {
        GitGlobalConfigDTO gitGlobalConfigDTO = getConnectRequest("url" + url, "", "", "", false);
        String response = gitDataService.connectToGitRepo(gitGlobalConfigDTO);
        assertThat(response.contains("/.git"));
        response = gitDataService.connectToGitRepo(gitGlobalConfigDTO);
        assertThat(response.contains("/.git"));
    }


}
