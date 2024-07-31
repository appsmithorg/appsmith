package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.TemplateDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationTemplateService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import mockwebserver3.Dispatcher;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Slf4j
@SpringBootTest
public class ApplicationTemplateServicePublishTemplateTest {
    private static MockWebServer mockCloudServices;

    @Autowired
    ApplicationTemplateService applicationTemplateService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    CloudServicesConfig cloudServicesConfig;

    static final Dispatcher dispatcher = new Dispatcher() {
        @Override
        public MockResponse dispatch(RecordedRequest request) throws InterruptedException {

            switch (request.getPath()) {
                case "/api/v1/app-templates/upload-community-template":
                    return new MockResponse().setResponseCode(500).setBody("Error while uploading template");

                default:
                    return new MockResponse()
                            .setHeader("x-header-name", "header-value")
                            .setResponseCode(200)
                            .setBody("response");
            }
        }
    };

    @BeforeAll
    public static void setUp() throws IOException {
        mockCloudServices = new MockWebServer();
        mockCloudServices.setDispatcher(dispatcher);
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
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());

        cloudServicesConfig.setBaseUrl(String.format("http://localhost:%s", mockCloudServices.getPort()));

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
        TemplateDTO templateDTO = new TemplateDTO();
        templateDTO.setApplicationId(testApp.getId());
        templateDTO.setWorkspaceId(testApp.getWorkspaceId());
        templateDTO.setTitle("Some title");
        templateDTO.setHeadline("Some headline");
        templateDTO.setDescription("Some description");
        templateDTO.setUseCases(List.of("uc1", "uc2"));
        templateDTO.setAuthorEmail("test@user.com");

        // make sure we've received the response returned by the mockCloudServices
        StepVerifier.create(applicationTemplateService.publishAsCommunityTemplate(templateDTO))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains("Received error from cloud services while publishing template"))
                .verify();

        // Test cleanup
        applicationPageService.deleteApplication(testApp.getId()).block();
        workspaceService.archiveById(savedWorkspace.getId()).block();
    }
}
