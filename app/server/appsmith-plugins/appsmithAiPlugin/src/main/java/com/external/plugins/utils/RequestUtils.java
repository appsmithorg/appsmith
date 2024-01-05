package com.external.plugins.utils;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.AI_SERVER_HOST;
import static com.external.plugins.constants.AppsmithAiConstants.DATA;
import static com.external.plugins.constants.AppsmithAiConstants.EXCHANGE_STRATEGIES;
import static com.external.plugins.constants.AppsmithAiConstants.QUERY_PATH;

public class RequestUtils {
    private static final WebClient webClient = createWebClient();

    public static String extractDataFromFormData(Map<String, Object> formData, String key) {
        return (String) ((Map<String, Object>) formData.get(key)).get(DATA);
    }

    public static String extractValueFromFormData(Map<String, Object> formData, String key) {
        return (String) formData.get(key);
    }

    public static URI createQueryUri() {
        return URI.create(AI_SERVER_HOST + QUERY_PATH);
    }

    public static URI createUploadURI() {
        return URI.create(AI_SERVER_HOST + "/assistant/upload");
    }

    public static Mono<ResponseEntity<byte[]>> makeRequest(
            HttpMethod httpMethod, URI uri, BodyInserter<?, ? super ClientHttpRequest> body) {
        return webClient
                .method(httpMethod)
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchangeToMono(clientResponse -> clientResponse.toEntity(byte[].class));
    }

    private static WebClient createWebClient() {
        // Initializing webClient to be used for http call
        WebClient.Builder webClientBuilder = WebClient.builder();
        return webClientBuilder
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create(connectionProvider())))
                .build();
    }

    private static ConnectionProvider connectionProvider() {
        return ConnectionProvider.builder("appsmithAiServer")
                .maxConnections(100)
                .maxIdleTime(Duration.ofSeconds(60))
                .maxLifeTime(Duration.ofSeconds(60))
                .pendingAcquireTimeout(Duration.ofSeconds(30))
                .evictInBackground(Duration.ofSeconds(120))
                .build();
    }
}
