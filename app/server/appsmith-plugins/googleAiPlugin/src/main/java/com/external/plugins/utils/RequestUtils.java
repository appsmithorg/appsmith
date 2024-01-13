package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.constants.GoogleAIConstants;
import com.external.plugins.constants.GoogleAIErrorMessages;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.net.URI;
import java.time.Duration;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.external.plugins.constants.GoogleAIConstants.GENERATE_CONTENT_ACTION;
import static com.external.plugins.constants.GoogleAIConstants.GOOGLE_AI_API_ENDPOINT;
import static com.external.plugins.constants.GoogleAIConstants.KEY;
import static com.external.plugins.constants.GoogleAIConstants.MODELS;

public class RequestUtils {

    private static final WebClient webClient = createWebClient();

    public static String extractDataFromFormData(Map<String, Object> formData, String key) {
        return (String) ((Map<String, Object>) formData.get(key)).get(GoogleAIConstants.DATA);
    }

    public static String extractValueFromFormData(Map<String, Object> formData, String key) {
        return (String) formData.get(key);
    }

    public static URI createUriFromCommand(String command, String model) {
        if (GoogleAIConstants.GENERATE_CONTENT.equals(command)) {
            return URI.create(GOOGLE_AI_API_ENDPOINT + MODELS + "/" + model + GENERATE_CONTENT_ACTION);
        } else {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Unsupported command: " + command);
        }
    }

    public static Mono<ResponseEntity<byte[]>> makeRequest(
            HttpMethod httpMethod, URI uri, ApiKeyAuth apiKeyAuth, BodyInserter<?, ? super ClientHttpRequest> body) {

        if (!StringUtils.hasText(apiKeyAuth.getValue())) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, GoogleAIErrorMessages.EMPTY_API_KEY);
        }

        return webClient
                .method(httpMethod)
                .uri(appendKeyInUri(apiKeyAuth.getValue(), uri))
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchangeToMono(clientResponse -> clientResponse.toEntity(byte[].class));
    }

    /**
     * Add key query params in requests
     * @param apiKey - Google AI API Key
     * @param uri - Actual request URI
     */
    private static URI appendKeyInUri(String apiKey, URI uri) {
        return UriComponentsBuilder.fromUri(uri).queryParam(KEY, apiKey).build().toUri();
    }

    private static WebClient createWebClient() {
        // Initializing webClient to be used for http call
        WebClient.Builder webClientBuilder = WebClient.builder();
        return webClientBuilder
                .exchangeStrategies(GoogleAIConstants.EXCHANGE_STRATEGIES)
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create(connectionProvider())))
                .build();
    }

    private static ConnectionProvider connectionProvider() {
        return ConnectionProvider.builder("googleAi")
                .maxConnections(100)
                .maxIdleTime(Duration.ofSeconds(60))
                .maxLifeTime(Duration.ofSeconds(60))
                .pendingAcquireTimeout(Duration.ofSeconds(30))
                .evictInBackground(Duration.ofSeconds(120))
                .build();
    }

    public static Set<String> validateApiKeyAuthDatasource(DatasourceConfiguration datasourceConfiguration) {
        Set<String> invalids = new HashSet<>();
        final ApiKeyAuth apiKeyAuth = (ApiKeyAuth) datasourceConfiguration.getAuthentication();

        if (apiKeyAuth == null || !StringUtils.hasText(apiKeyAuth.getValue())) {
            invalids.add(GoogleAIErrorMessages.EMPTY_API_KEY);
        }

        return invalids;
    }
}
