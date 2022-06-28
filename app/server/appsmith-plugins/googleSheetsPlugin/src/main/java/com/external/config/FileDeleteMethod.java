package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * API reference: https://developers.google.com/sheets/api/guides/migration#delete_a_sheet
 */
public class FileDeleteMethod implements ExecutionMethod {

    ObjectMapper objectMapper;

    public FileDeleteMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateExecutionMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Spreadsheet Url");
        }
        return true;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        return Mono.just(true);
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getExecutionClient(WebClient webClient, MethodConfig methodConfig) {

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_DRIVE_API_URL,
                methodConfig.getSpreadsheetId(), /* spreadsheet Id */
                true
        );

        return webClient.method(HttpMethod.DELETE)
                .uri(uriBuilder.build(true).toUri());

    }

    @Override
    public JsonNode transformExecutionResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }

        String errorMessage = "Deleted spreadsheet successfully!";

        return this.objectMapper.valueToTree(Map.of("message", errorMessage));
    }

}
