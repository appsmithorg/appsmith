package com.appsmith.server.controllers;

import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.constants.Url;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.NewActionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;

@ExtendWith(SpringExtension.class)
@WebFluxTest(AnalyticsController.class)
@Import(SecurityTestConfig.class)
public class AnalyticsControllerTest {
    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private NewActionService newActionService;

    @MockBean
    private ApplicationPageService applicationPageService;


    @Test
    @WithMockUser
    public void postAnalyticsEvent_InvalidRequestBody() {
        webTestClient.post().uri(Url.ANALYTICS_URL + "/event").
                contentType(MediaType.APPLICATION_JSON).
                body(BodyInserters.fromValue("{}")).
                exchange().
                expectStatus().isEqualTo(500).
                expectBody().json("{\n" +
                        "    \"responseMeta\": {\n" +
                        "        \"status\": 500,\n" +
                        "        \"success\": false,\n" +
                        "        \"error\": {\n" +
                        "            \"code\": 5000,\n" +
                        "            \"message\": \"Internal server error while processing request\"\n" +
                        "        }\n" +
                        "    }\n" +
                        "}");
    }
}
