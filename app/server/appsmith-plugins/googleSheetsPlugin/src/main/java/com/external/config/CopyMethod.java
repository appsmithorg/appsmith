package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.constants.ErrorMessages;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.sheets/copyTo
 */
public class CopyMethod implements ExecutionMethod {

    ObjectMapper objectMapper;

    public CopyMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateExecutionMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, ErrorMessages.MISSING_SPREADSHEET_URL_ERROR_MSG);
        }
        if (methodConfig.getSheetId() == null || methodConfig.getSheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, ErrorMessages.MISSING_SHEET_ID_ERROR_MSG);
        }
        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getExecutionClient(WebClient webClient, MethodConfig methodConfig) {

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + "/sheets/"
                        + methodConfig.getSheetId() /* sheet Id*/
                        + ":copyTo",
                true
        );

        return webClient.method(HttpMethod.POST)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromObject(methodConfig.getRowObjects()));
    }

}
