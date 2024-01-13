package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.net.URI;
import java.time.Duration;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.external.plugins.constants.OpenAIConstants.CHAT;
import static com.external.plugins.constants.OpenAIConstants.CHAT_ENDPOINT;
import static com.external.plugins.constants.OpenAIConstants.COMMAND;
import static com.external.plugins.constants.OpenAIConstants.DATA;
import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS;
import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS_ENDPOINT;
import static com.external.plugins.constants.OpenAIConstants.EXCHANGE_STRATEGIES;
import static com.external.plugins.constants.OpenAIConstants.MODEL;
import static com.external.plugins.constants.OpenAIConstants.MODELS_ENDPOINT;
import static com.external.plugins.constants.OpenAIConstants.OPEN_AI_HOST;
import static com.external.plugins.constants.OpenAIConstants.VISION;
import static com.external.plugins.constants.OpenAIConstants.VISION_ENDPOINT;
import static com.external.plugins.constants.OpenAIErrorMessages.EMPTY_BEARER_TOKEN;

public class RequestUtils {
    private static final WebClient webClient = createWebClient();

    public static String extractDataFromFormData(Map<String, Object> formData, String key) {
        return (String) ((Map<String, Object>) formData.get(key)).get(DATA);
    }

    public static String extractValueFromFormData(Map<String, Object> formData, String key) {
        return (String) formData.get(key);
    }

    public static URI createUri(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        String command = extractDataFromFormData(formData, COMMAND);
        return createUriFromCommand(command);
    }

    public static URI createUriFromCommand(String command) {
        if (CHAT.equals(command)) {
            return URI.create(OPEN_AI_HOST + CHAT_ENDPOINT);
        } else if (EMBEDDINGS.equals(command)) {
            return URI.create(OPEN_AI_HOST + EMBEDDINGS_ENDPOINT);
        } else if (VISION.equals(command)) {
            return URI.create(OPEN_AI_HOST + VISION_ENDPOINT);
        } else if (MODEL.equals(command)) {
            return URI.create(OPEN_AI_HOST + MODELS_ENDPOINT);
        } else {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }
    }

    public static Mono<ResponseEntity<byte[]>> makeRequest(
            HttpMethod httpMethod,
            URI uri,
            BearerTokenAuth bearerTokenAuth,
            BodyInserter<?, ? super ClientHttpRequest> body) {

        // Authentication will already be valid at this point
        assert (bearerTokenAuth.getBearerToken() != null);

        return webClient
                .method(httpMethod)
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .headers(
                        headers -> headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + bearerTokenAuth.getBearerToken()))
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
        return ConnectionProvider.builder("openai")
                .maxConnections(100)
                .maxIdleTime(Duration.ofSeconds(60))
                .maxLifeTime(Duration.ofSeconds(60))
                .pendingAcquireTimeout(Duration.ofSeconds(30))
                .evictInBackground(Duration.ofSeconds(120))
                .build();
    }

    public static Set<String> validateBearerTokenDatasource(DatasourceConfiguration datasourceConfiguration) {
        Set<String> invalids = new HashSet<>();
        final BearerTokenAuth bearerTokenAuth = (BearerTokenAuth) datasourceConfiguration.getAuthentication();

        if (bearerTokenAuth == null || !StringUtils.hasText(bearerTokenAuth.getBearerToken())) {
            invalids.add(EMPTY_BEARER_TOKEN);
        }

        return invalids;
    }
}
