package com.appsmith.server.configurations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A plain {@code WebClient.builder()} gets its JSON codecs from the classpath. The server and the plugins send Jackson
 * 2 types such as {@link JsonNode} through such clients, so this fails if Jackson 3 codecs replace the Jackson 2 ones.
 */
class PlainWebClientJsonCodecTest {

    private MockWebServer server;

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    @Test
    void should_sendJsonNodeContent_when_plainWebClientWritesJackson2JsonNode() throws Exception {
        // Given
        // KeycloakIntegrationServiceImpl sends the Keycloak user profile this way.
        String userProfileJson = "{\"attributes\":[{\"name\":\"email\"}]}";
        JsonNode userProfile = new ObjectMapper().readTree(userProfileJson);
        server.enqueue(new MockResponse().setResponseCode(204));

        // When
        Mono<ResponseEntity<Void>> response = WebClient.builder()
                .build()
                .put()
                .uri("http://localhost:" + server.getPort() + "/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(userProfile))
                .retrieve()
                .toBodilessEntity();

        // Then
        StepVerifier.create(response).expectNextCount(1).verifyComplete();
        assertThat(server.takeRequest().getBody().readUtf8()).isEqualTo(userProfileJson);
    }
}
