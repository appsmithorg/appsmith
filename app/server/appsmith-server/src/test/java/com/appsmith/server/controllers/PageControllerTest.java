package com.appsmith.server.controllers;

import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.configurations.RedisTestContainerConfig;
import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.CreateDBTablePageSolution;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(SpringExtension.class)
@WebFluxTest(PageController.class)
@Import({ProjectProperties.class, SecurityTestConfig.class, RedisUtils.class, RedisTestContainerConfig.class})
public class PageControllerTest {

    @Autowired
    private WebTestClient client;

    @MockBean
    private ApplicationPageService applicationPageService;

    @MockBean
    private NewPageService newPageService;

    @MockBean
    private CreateDBTablePageSolution createDBTablePageSolution;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private GitFileUtils gitFileUtils;

    @MockBean
    private SessionUserService sessionUserService;

    @Test
    @WithMockUser
    void noBody() {
        client.put().uri("/api/v1/pages/abcdef").exchange().expectStatus().isBadRequest();
    }

    @ParameterizedTest
    @ValueSource(strings = {"../malicious", "..\\malicious", "/malicious", "C:\\malicious"})
    @WithMockUser
    void invalidName(String name) {
        client.put()
                .uri("/api/v1/pages/abcdef")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(Map.of("name", name)))
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errorDisplay")
                .value(s -> assertThat((String) s).contains("Validation Failure"));

        verifyNoInteractions(newPageService);
    }
}
