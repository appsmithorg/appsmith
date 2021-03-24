package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;

public interface Method {

    String BASE_SHEETS_API_URL = "https://sheets.googleapis.com/v4/spreadsheets/";

    String BASE_DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files/";

    ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies
            .builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();

    default UriComponentsBuilder getBaseUriBuilder(String baseUri, String path) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            return uriBuilder.uri(new URI(baseUri + path));
        } catch (URISyntaxException e) {
            throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
        }
    }

    boolean validateMethodRequest(MethodConfig methodConfig, String body);

    default Mono<Boolean> executePrerequisites(MethodConfig methodConfig, String body, OAuth2 oauth2) {
        return Mono.just(true);
    }

    WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig, String body);

    default JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw Exceptions.propagate(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object."));
        }
        // By default, no transformation takes place
        return response;
    }
}
