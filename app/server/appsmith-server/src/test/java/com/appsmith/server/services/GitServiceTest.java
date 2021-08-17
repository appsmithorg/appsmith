package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
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

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg == null ? "" : testOrg.getId();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void  cloneRepo_validRemote_cloneSucess() throws IOException {
        String url = "https://github.com/AnaghHegde/Enigma-Reborn.git";
        String response = gitDataService.connectToGitRepo(url, orgId);
        assertThat(response.contains("/.git"));
    }

    @Test(expected = TransportException.class)
    @WithUserDetails(value = "api_user")
    public void  cloneRepo_inaValidRemote_ThrowsGitAPIException() throws IOException {
        String url = "url:https://github.com/appsmithorg/appsmith-docs.git";
        TransportException exception = assertThrows(TransportException.class,
                ()-> gitDataService.connectToGitRepo(url, orgId));
        assertThat(exception.getMessage()).contains("remote hung up unexpectedly");
    }
}
