package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

public interface Method {

    String BASE_SHEETS_API_URL = "https://sheets.googleapis.com/v4/spreadsheets/";

    String BASE_DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files/";

    default UriComponentsBuilder getBaseUriBuilder(String baseUri, String path) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            return uriBuilder.uri(new URI(baseUri + path));
        } catch (URISyntaxException e) {
            throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
        }
    }

    WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig, String body);

    default JsonNode transformResponse(JsonNode response, ObjectMapper objectMapper) {
        if (response == null) {
            throw Exceptions.propagate(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object."));
        }
        // By default, no transformation takes place
        return response;
    }
}
