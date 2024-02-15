package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.lang.reflect.Type;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.AI_SERVER_HOST;
import static com.external.plugins.constants.AppsmithAiConstants.ASSOCIATE_PATH;
import static com.external.plugins.constants.AppsmithAiConstants.DATA;
import static com.external.plugins.constants.AppsmithAiConstants.EXCHANGE_STRATEGIES;
import static com.external.plugins.constants.AppsmithAiConstants.FILES;
import static com.external.plugins.constants.AppsmithAiConstants.FILES_STATUS_PATH;
import static com.external.plugins.constants.AppsmithAiConstants.FILE_PATH;
import static com.external.plugins.constants.AppsmithAiConstants.QUERY_PATH;
import static com.external.plugins.constants.AppsmithAiErrorMessages.QUERY_FAILED_TO_EXECUTE;

public class RequestUtils {
    private static final WebClient webClient = createWebClient();
    private static final Gson gson = new GsonBuilder().create();

    public static String extractDataFromFormData(Map<String, Object> formData, String key) {
        return (String) ((Map<String, Object>) formData.get(key)).get(DATA);
    }

    public static String extractValueFromFormData(Map<String, Object> formData, String key) {
        return (String) formData.get(key);
    }

    public static URI getQueryUri() {
        return URI.create(AI_SERVER_HOST + QUERY_PATH);
    }

    public static URI getAssociateUri() {
        return URI.create(AI_SERVER_HOST + ASSOCIATE_PATH);
    }

    public static URI getFileUploadUri() {
        return URI.create(AI_SERVER_HOST + FILE_PATH);
    }

    public static URI getFileStatusUri() {
        return URI.create(AI_SERVER_HOST + FILES_STATUS_PATH);
    }

    public static Mono<ResponseEntity<byte[]>> makeRequest(
            HttpMethod httpMethod,
            URI uri,
            MediaType contentType,
            @NotNull Map<String, String> headers,
            BodyInserter<?, ? super ClientHttpRequest> body) {
        return webClient
                .method(httpMethod)
                .uri(uri)
                .headers(httpHeaders -> headers.forEach(httpHeaders::add))
                .contentType(contentType)
                .body(body)
                .exchangeToMono(clientResponse -> clientResponse.toEntity(byte[].class));
    }

    public static Mono<Object> handleResponse(ResponseEntity<byte[]> responseEntity) {
        return handleResponse(responseEntity, Object.class);
    }

    public static Mono<Object> handleResponse(ResponseEntity<byte[]> responseEntity, Type clazz) {

        HttpStatusCode statusCode = responseEntity.getStatusCode();

        if (HttpStatusCode.valueOf(401).isSameCodeAs(statusCode)) {
            String errorMessage = "";
            if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                errorMessage = new String(responseEntity.getBody());
            }
            return Mono.error(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_AUTHENTICATION_ERROR, errorMessage));
        }
        if (HttpStatusCode.valueOf(429).isSameCodeAs(statusCode)) {
            String errorMessage = "";
            if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                errorMessage = new String(responseEntity.getBody());
            }
            return Mono.error(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_RATE_LIMIT_ERROR, errorMessage));
        }

        if (statusCode.is4xxClientError()) {
            String errorMessage = "";
            if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                errorMessage = new String(responseEntity.getBody());
            }
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ERROR, errorMessage));
        }

        Object body = gson.fromJson(new String(responseEntity.getBody()), clazz);
        if (!statusCode.is2xxSuccessful()) {
            return Mono.error(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, QUERY_FAILED_TO_EXECUTE, body));
        }
        return Mono.just(body);
    }

    public static Mono<ResponseEntity<byte[]>> makeRequest(
            HttpMethod httpMethod, URI uri, @NotNull Map<String, String> headers, List<FilePart> fileParts) {
        return makeRequest(
                httpMethod,
                uri,
                MediaType.MULTIPART_FORM_DATA,
                headers,
                BodyInserters.fromMultipartData(new LinkedMultiValueMap<>(Map.of(FILES, fileParts))));
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
