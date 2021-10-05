package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * API reference: https://developers.google.com/sheets/api/guides/migration#list_spreadsheets_for_the_authenticated_user
 */
public class ListSheetsMethod implements Method {

    ObjectMapper objectMapper;

    public ListSheetsMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig) {
        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_DRIVE_API_URL,
                "?q=mimeType%3D'application%2Fvnd.google-apps.spreadsheet'%20and%20trashed%3Dfalse", true);

        return webClient.method(HttpMethod.GET)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.empty());
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }
        if (response.get("files") == null) {
            return this.objectMapper.createArrayNode();
        }
        List<Map<String, String>> filesList = StreamSupport
                .stream(response.get("files").spliterator(), false)
                .map(file -> {

                    return Map.of("id", file.get("id").asText(),
                            "name", file.get("name").asText());
                })
                .collect(Collectors.toList());

        return this.objectMapper.valueToTree(filesList);
    }
}
