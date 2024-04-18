package com.appsmith.server.controllers;

import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.newpages.base.NewPageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;

@SpringBootTest
@AutoConfigureWebTestClient
@Import({SecurityTestConfig.class})
public class PageControllerTest {

    @Autowired
    private WebTestClient client;

    @MockBean
    private NewPageService newPageService;

    @Test
    @WithMockUser
    void noBody() {
        client.put().uri("/api/v1/pages/abcdef").exchange().expectStatus().isBadRequest();
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "../mal", "..\\mal", "/mal", "C:\\mal", "mal/", "/mal/", "\\mal", "mal\\", "\\mal\\", ":mal", ":mal/",
                ":mal\\"
            })
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
