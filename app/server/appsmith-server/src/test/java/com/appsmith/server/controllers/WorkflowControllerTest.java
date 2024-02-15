package com.appsmith.server.controllers;

import com.appsmith.server.configurations.InMemoryReactiveClientRegistrationRepositoryConfiguration;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.RedisTestContainerConfig;
import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.configurations.solutions.OidcAccessTokenUpdateSolution;
import com.appsmith.server.constants.Url;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import com.appsmith.server.workflows.interact.InteractWorkflowService;
import com.appsmith.server.workflows.proxy.ProxyWorkflowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.Map;

@ExtendWith(SpringExtension.class)
@WebFluxTest(WorkflowController.class)
@Import({
    SecurityTestConfig.class,
    RedisUtils.class,
    RedisTestContainerConfig.class,
    InMemoryReactiveClientRegistrationRepositoryConfiguration.class
})
public class WorkflowControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private CrudWorkflowService crudWorkflowService;

    @MockBean
    private ProxyWorkflowService proxyWorkflowService;

    @MockBean
    private InteractWorkflowService interactWorkflowService;

    @MockBean
    ProjectProperties projectProperties;

    @MockBean
    UserDataService userDataService;

    @MockBean
    OidcAccessTokenUpdateSolution oidcAccessTokenUpdateSolution;

    @MockBean
    AnalyticsService analyticsService;

    @MockBean
    GitFileUtils gitFileUtils;

    @MockBean
    SessionUserService sessionUserService;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    void setUp() {
        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(Boolean.TRUE));
    }

    @Test
    @WithMockUser
    void testTriggerWorkflow_withoutTriggerData() {
        Mockito.when(interactWorkflowService.triggerWorkflow(
                        Mockito.anyString(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(Map.of()));

        webTestClient
                .post()
                .uri(Url.WORKFLOW_URL + "/trigger/workflowId")
                .exchange()
                .expectStatus()
                .isEqualTo(200);
    }

    @Test
    @WithMockUser
    void testTriggerWorkflow_withTriggerData() {
        Mockito.when(interactWorkflowService.triggerWorkflow(
                        Mockito.anyString(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(Map.of()));

        webTestClient
                .post()
                .uri(Url.WORKFLOW_URL + "/trigger/workflowId")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue("{}"))
                .exchange()
                .expectStatus()
                .isEqualTo(200);
    }
}
