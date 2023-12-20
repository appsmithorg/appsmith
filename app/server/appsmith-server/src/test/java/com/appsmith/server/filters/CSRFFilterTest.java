package com.appsmith.server.filters;

import com.appsmith.server.constants.Url;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.junit.jupiter.api.Assertions.*;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureWebTestClient
class CSRFFilterTest {
    @Autowired
    WebTestClient webTestClient;

    @Test
    void testGetMethodsWithoutAppsmithRequestedBy() {
        webTestClient
                .get()
                .uri(Url.USER_URL + "/manage/all")
                .exchange()
                .expectStatus()
                .isEqualTo(401);
    }

    @Test
    void testInvalidTriggerWorkflowUrlsWithoutAppsmithRequestedBy_noId() {
        webTestClient
                .post()
                .uri(Url.WORKFLOW_URL + "/trigger/")
                .exchange()
                .expectStatus()
                .isEqualTo(500);
    }

    @Test
    void testInvalidTriggerWorkflowUrlsWithoutAppsmithRequestedBy_invalidId() {
        webTestClient
                .post()
                .uri(Url.WORKFLOW_URL + "/trigger/1/2")
                .exchange()
                .expectStatus()
                .isEqualTo(500);
    }

    @Test
    void testValidTriggerWorkflowUrlsWithoutAppsmithRequestedBy() {
        webTestClient
                .post()
                .uri(Url.WORKFLOW_URL + "/trigger/1asfd12340")
                .exchange()
                .expectStatus()
                .isEqualTo(401);
    }
}
