package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * API reference: https://developers.google.com/drive/api/v3/reference/files/get
 * For allowed fields: https://developers.google.com/drive/api/v3/reference/files
 */
public class InfoMethod implements Method {

    ObjectMapper objectMapper;

    public InfoMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        WebClient client = WebClient.builder()
            .exchangeStrategies(EXCHANGE_STRATEGIES)
            .build();
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
            methodConfig.getSpreadsheetId());
        uriBuilder.queryParam("fields", "sheets/properties");
        return client.method(HttpMethod.GET)
            .uri(uriBuilder.build(false).toUri())
            .body(BodyInserters.empty())
            .headers(headers -> headers.set(
                "Authorization",
                "Bearer " + oauth2.getAuthenticationResponse().getToken()))
            .exchange()
            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
            .map(response -> {// Choose body depending on response status
                byte[] responseBody = response.getBody();

                if (responseBody == null || !response.getStatusCode().is2xxSuccessful()) {
                    throw Exceptions.propagate(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Could not map request back to existing data"));
                }
                String jsonBody = new String(responseBody);
                JsonNode sheets = null;
                try {
                    sheets = objectMapper.readTree(jsonBody).get("sheets");
                } catch (IOException e) {
                    throw Exceptions.propagate(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                        new String(responseBody),
                        e.getMessage()
                    ));
                }

                assert sheets != null;
                List<JsonNode> sheetMetadata = new ArrayList<>();
                for (JsonNode sheet : sheets) {
                    final JsonNode properties = sheet.get("properties");
                    if (!properties.get("title").asText().isEmpty()) {
                        sheetMetadata.add(properties);
                    }
                }
                methodConfig.setBody(sheetMetadata);
                return methodConfig;
            });
    }

    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Missing required field Spreadsheet Url");
        }

        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_DRIVE_API_URL,
                methodConfig.getSpreadsheetId() +
                        "?fields=id,name,permissions/role,permissions/emailAddress,createdTime,modifiedTime");

        return webClient.method(HttpMethod.GET)
                .uri(uriBuilder.build(false).toUri())
                .body(BodyInserters.empty());
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                AppsmithPluginError.PLUGIN_ERROR,
                "Missing a valid response object.");
        }

        Map<String, Object> responseObj = new HashMap<>();
        if (methodConfig.getBody() instanceof List) {
            responseObj.put("sheets", methodConfig.getBody());
        }
        Iterator<String> fieldNames = response.fieldNames();
        while(fieldNames.hasNext()) {
            String fieldName = fieldNames.next();
            responseObj.put(fieldName, response.get(fieldName));
        }
        return this.objectMapper.valueToTree(responseObj);
    }

}
