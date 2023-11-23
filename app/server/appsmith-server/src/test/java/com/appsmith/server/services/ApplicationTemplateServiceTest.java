package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.CommunityTemplateDTO;
import lombok.extern.slf4j.Slf4j;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@TestMethodOrder(MethodOrderer.MethodName.class)
public class ApplicationTemplateServiceTest {
    private static MockWebServer mockCloudServices;

    @Autowired
    ApplicationTemplateService applicationTemplateService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    CloudServicesConfig cloudServicesConfig;

    @BeforeAll
    public static void setUp() throws IOException {
        mockCloudServices = new MockWebServer();
        mockCloudServices.start();
    }

    @AfterAll
    public static void tearDown() throws IOException {
        mockCloudServices.shutdown();
    }

    private Application setUpTestApplicationForWorkspace(String workspaceId) {
        Application testApplication = new Application();
        testApplication.setName("Export-Application-Test-Application");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());

        cloudServicesConfig.setBaseUrl(String.format("http://localhost:%s", mockCloudServices.getPort()));
        mockCloudServices.enqueue(
                new MockResponse().setBody("{\"status\": 1}").addHeader("Content-Type", "application/json"));

        return applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test_application_published_as_community_template() {
        // Create Workspace
        Workspace workspace = new Workspace();
        workspace.setName("Import-Export-Test-Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();

        Application testApp = setUpTestApplicationForWorkspace(savedWorkspace.getId());
        CommunityTemplateDTO communityTemplateDTO = new CommunityTemplateDTO();
        communityTemplateDTO.setApplicationId(testApp.getId());
        communityTemplateDTO.setWorkspaceId(testApp.getWorkspaceId());
        communityTemplateDTO.setTitle("Some title");
        communityTemplateDTO.setHeadline("Some headline");
        communityTemplateDTO.setDescription("Some description");
        communityTemplateDTO.setUseCases(List.of("uc1", "uc2"));
        communityTemplateDTO.setAuthorEmail("test@user.com");

        StepVerifier.create(applicationTemplateService.publishAsCommunityTemplate(communityTemplateDTO))
                .assertNext(updatedApplication -> {
                    assertThat(updatedApplication.getIsCommunityTemplate()).isTrue();
                    assertThat(updatedApplication.getForkingEnabled()).isTrue();
                    assertThat(updatedApplication.getIsPublic()).isTrue();
                })
                .verifyComplete();

        // Test cleanup
        applicationPageService.deleteApplication(testApp.getId()).block();
        workspaceService.archiveById(savedWorkspace.getId()).block();
    }
}
