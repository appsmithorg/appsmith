package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.external.config.MethodConfig;
import com.external.constants.ErrorMessages;
import com.external.enums.GoogleSheetMethodEnum;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.apache.commons.collections.CollectionUtils.isEmpty;

public class SheetsUtil {

    private static final String FILE_SPECIFIC_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
    private static final int USER_AUTHORIZED_SHEET_IDS_INDEX = 1;

    public static Set<String> validateAndGetUserAuthorizedSheetIds(
            DatasourceConfiguration datasourceConfiguration, MethodConfig methodConfig) {
        OAuth2 oAuth2 = (OAuth2) datasourceConfiguration.getAuthentication();
        Set<String> userAuthorisedSheetIds = null;
        if (!isEmpty(datasourceConfiguration.getProperties())
                && datasourceConfiguration.getProperties().size() > 1
                && datasourceConfiguration.getProperties().get(USER_AUTHORIZED_SHEET_IDS_INDEX) != null
                && datasourceConfiguration
                                .getProperties()
                                .get(USER_AUTHORIZED_SHEET_IDS_INDEX)
                                .getValue()
                        != null
                && oAuth2.getScope() != null
                && oAuth2.getScope().contains(FILE_SPECIFIC_DRIVE_SCOPE)) {
            ArrayList<String> temp = (ArrayList) datasourceConfiguration
                    .getProperties()
                    .get(USER_AUTHORIZED_SHEET_IDS_INDEX)
                    .getValue();
            userAuthorisedSheetIds = new HashSet<String>(temp);

            // This is added specifically for selected gsheets, so that whenever authorisation changes from one sheet to
            // another
            // We throw an error, this is done because when we use drive.file scope which is for selected sheets through
            // file picker
            // The access token for this scope grants access to all selected sheets across datasources
            // we want to constraint the access for datasource to the sheet which was selected during ds authorisation
            if (methodConfig != null
                    && methodConfig.getSpreadsheetId() != null
                    && !userAuthorisedSheetIds.contains(methodConfig.getSpreadsheetId())) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        ErrorMessages.MISSING_SPREADSHEET_URL_SELECTED_SHEETS_ERROR_MSG);
            }
        }
        return userAuthorisedSheetIds;
    }

    public static Map<String, String> getSpreadsheetData(
            JsonNode file, Set<String> userAuthorizedSheetIds, GoogleSheetMethodEnum methodType) {
        // This if block will be executed for all sheets modality
        if (userAuthorizedSheetIds == null) {
            return extractSheetData((JsonNode) file, methodType);
        }

        // This block will be executed for specific sheets modality
        String fileId = file.get("id").asText();
        // This will filter out and send only authorised google sheet files to client
        if (userAuthorizedSheetIds.contains(fileId)) {
            return extractSheetData((JsonNode) file, methodType);
        }

        return null;
    }

    private static Map<String, String> extractSheetData(JsonNode file, GoogleSheetMethodEnum methodType) {
        final String spreadSheetUrl =
                "https://docs.google.com/spreadsheets/d/" + file.get("id").asText() + "/edit";
        switch (methodType) {
            case TRIGGER:
                return Map.of("label", file.get("name").asText(), "value", spreadSheetUrl);
            default:
                return Map.of(
                        "id", file.get("id").asText(), "name", file.get("name").asText(), "url", spreadSheetUrl);
        }
    }
}
