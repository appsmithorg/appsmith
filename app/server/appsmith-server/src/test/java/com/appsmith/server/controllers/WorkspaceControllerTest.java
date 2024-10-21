package com.appsmith.server.controllers;

import com.appsmith.server.configurations.RedisTestContainerConfig;
import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;

@SpringBootTest
@AutoConfigureWebTestClient
@Import({SecurityTestConfig.class, RedisUtils.class, RedisTestContainerConfig.class})
@ExtendWith(AfterAllCleanUpExtension.class)
public class WorkspaceControllerTest {
    @MockBean
    WorkspaceService workspaceService;

    @Autowired
    private WebTestClient webTestClient;

    @Test
    @WithMockUser
    public void getWorkspaceNoName() {
        webTestClient
                .post()
                .uri("/api/v1/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue("{}"))
                .exchange()
                .expectStatus()
                .isEqualTo(400)
                .expectBody()
                .json("{\n" + "    \"responseMeta\": {\n"
                        + "        \"status\": 400,\n"
                        + "        \"success\": false,\n"
                        + "        \"error\": {\n"
                        + "            \"code\": "
                        + AppsmithErrorCode.VALIDATION_FAILURE.getCode() + ",\n"
                        + "            \"message\": \"Validation Failure(s): {name=Name is mandatory}\"\n"
                        + "        }\n"
                        + "    }\n"
                        + "}");
    }
}
