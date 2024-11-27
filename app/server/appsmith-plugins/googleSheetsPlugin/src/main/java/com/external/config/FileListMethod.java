package com.external.config;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.constants.ErrorMessages;
import com.external.enums.GoogleSheetMethodEnum;
import com.external.plugins.exceptions.GSheetsPluginError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.external.utils.SheetsUtil.getSpreadsheetData;

/**
 * API reference: https://developers.google.com/sheets/api/guides/migration#list_spreadsheets_for_the_authenticated_user
 */
public class FileListMethod implements ExecutionMethod, TriggerMethod {
    ObjectMapper objectMapper;
    private final String SHARED_DRIVE_PARAMS =
            "&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=allDrives";

    public FileListMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateExecutionMethodRequest(MethodConfig methodConfig) {
        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getExecutionClientWithFlags(
            WebClient webClient, MethodConfig methodConfig, Map<String, Boolean> featureFlagMap) {
        // Flags are needed here for google sheets integration to support shared drive behind a flag
        // Once thoroughly tested, this flag can be removed
        Boolean isSharedDriveSupportEnabled = featureFlagMap.getOrDefault(
                FeatureFlagEnum.release_google_sheets_shared_drive_support_enabled.toString(), Boolean.FALSE);
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(
                this.BASE_DRIVE_API_URL,
                "?orderBy=name&q=mimeType%3D'application%2Fvnd.google-apps.spreadsheet'%20and%20trashed%3Dfalse"
                        + (isSharedDriveSupportEnabled.equals(Boolean.TRUE) ? SHARED_DRIVE_PARAMS : ""),
                true);

        return webClient
                .method(HttpMethod.GET)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.empty());
    }

    @Override
    public JsonNode transformExecutionResponse(
            JsonNode response, MethodConfig methodConfig, Set<String> userAuthorizedSheetIds) {
        if (response == null) {
            throw new AppsmithPluginException(
                    GSheetsPluginError.QUERY_EXECUTION_FAILED, ErrorMessages.MISSING_VALID_RESPONSE_ERROR_MSG);
        }
        if (response.get("files") == null) {
            return this.objectMapper.createArrayNode();
        }
        List<Map<String, String>> filesList = StreamSupport.stream(
                        response.get("files").spliterator(), false)
                .map(file -> getSpreadsheetData((JsonNode) file, userAuthorizedSheetIds, GoogleSheetMethodEnum.EXECUTE))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return this.objectMapper.valueToTree(filesList);
    }

    @Override
    public boolean validateTriggerMethodRequest(MethodConfig methodConfig) {
        return this.validateExecutionMethodRequest(methodConfig);
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getTriggerClientWithFlags(
            WebClient webClient, MethodConfig methodConfig, Map<String, Boolean> featureFlagMap) {
        return this.getExecutionClientWithFlags(webClient, methodConfig, featureFlagMap);
    }

    @Override
    public JsonNode transformTriggerResponse(
            JsonNode response, MethodConfig methodConfig, Set<String> userAuthorizedSheetIds) {
        if (response == null) {
            throw new AppsmithPluginException(
                    GSheetsPluginError.QUERY_EXECUTION_FAILED, ErrorMessages.MISSING_VALID_RESPONSE_ERROR_MSG);
        }
        if (response.get("files") == null) {
            return this.objectMapper.createArrayNode();
        }
        List<Map<String, String>> filesList = StreamSupport.stream(
                        response.get("files").spliterator(), false)
                .map(file -> getSpreadsheetData((JsonNode) file, userAuthorizedSheetIds, GoogleSheetMethodEnum.TRIGGER))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return this.objectMapper.valueToTree(filesList);
    }
}
