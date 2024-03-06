package com.external.plugins.utils;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.Map;

import static com.external.plugins.constants.FieldNames.DATA;

public class RequestUtility {
    private static final WebClient webClient = createWebClient();

    private static WebClient createWebClient() {
        // Initializing webClient to be used for http call
        return WebClient.builder().build();
    }

    public static Mono<ResponseEntity<String>> makeRequest(
            HttpMethod httpMethod, URI uri, HttpHeaders httpHeaders, BodyInserter<?, ? super ClientHttpRequest> body) {

        return webClient
                .method(httpMethod)
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .headers(headers -> headers.addAll(httpHeaders))
                .exchangeToMono(clientResponse -> clientResponse.toEntity(String.class));
    }

    public static String extractStringFromFormData(Map<String, Object> formData, String key) {
        if (CollectionUtils.isEmpty(formData) || !formData.containsKey(key)) {
            return null;
        }
        return (String) ((Map<String, Object>) formData.get(key)).get(DATA);
    }
}
