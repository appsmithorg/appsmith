package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.constants.AnthropicConstants;
import com.external.plugins.constants.AnthropicErrorMessages;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
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

import static com.external.plugins.constants.AnthropicConstants.ANTHROPIC_API_ENDPOINT;
import static com.external.plugins.constants.AnthropicConstants.COMPLETION_API;

public class RequestUtils {

    private static final WebClient webClient = createWebClient();

    public static String extractDataFromFormData(Map<String, Object> formData, String key) {
        return (String) ((Map<String, Object>) formData.get(key)).get(AnthropicConstants.DATA);
    }

    public static String extractValueFromFormData(Map<String, Object> formData, String key) {
        return (String) formData.get(key);
    }

    public static URI createUriFromCommand(String command) {
        if (AnthropicConstants.CHAT.equals(command)) {
            return URI.create(ANTHROPIC_API_ENDPOINT + COMPLETION_API);
        } else if (AnthropicConstants.MODEL.equals(command)) {
            return URI.create("");
        } else {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }
    }

    public static Mono<ResponseEntity<byte[]>> makeRequest(
            HttpMethod httpMethod, URI uri, ApiKeyAuth apiKeyAuth, BodyInserter<?, ? super ClientHttpRequest> body) {

        // Authentication will already be valid at this point
        assert (apiKeyAuth.getValue() != null);

        return webClient
                .method(httpMethod)
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .headers(headers -> {
                    headers.set(AnthropicConstants.API_KEY_HEADER, apiKeyAuth.getValue());
                    headers.set(AnthropicConstants.ANTHROPIC_VERSION_HEADER, AnthropicConstants.ANTHROPIC_VERSION);
                })
                .exchangeToMono(clientResponse -> clientResponse.toEntity(byte[].class));
    }

    private static WebClient createWebClient() {
        // Initializing webClient to be used for http call
        WebClient.Builder webClientBuilder = WebClient.builder();
        return webClientBuilder
                .exchangeStrategies(AnthropicConstants.EXCHANGE_STRATEGIES)
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create(connectionProvider())))
                .build();
    }

    private static ConnectionProvider connectionProvider() {
        return ConnectionProvider.builder("anthropic")
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
            invalids.add(AnthropicErrorMessages.EMPTY_API_KEY);
        }

        return invalids;
    }
}
