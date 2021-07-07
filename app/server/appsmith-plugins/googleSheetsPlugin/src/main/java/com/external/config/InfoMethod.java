package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

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
    public boolean validateMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Spreadsheet Url");
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

}
