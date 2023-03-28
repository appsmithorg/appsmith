package com.external.utils;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import static org.apache.commons.collections.CollectionUtils.isEmpty;
import com.appsmith.external.models.DatasourceConfiguration;

public class SheetsUtil {

    static Pattern COLUMN_NAME_PATTERN = Pattern.compile("[a-zA-Z]+");

    public static int getColumnNumber(String columnName) {
        if (COLUMN_NAME_PATTERN.matcher(columnName.trim()).find()) {
            int column = 0;
            for (int i = 0; i < columnName.length(); i++) {
                String character = String.valueOf(columnName.charAt(i));
                character = character.toUpperCase();
                column = column * 26 + ((int)character.charAt(0)) - 64;
            }
            return column;
        }
        return 1;
    }

    public static Set<String> getUserAuthorizedSheetIds(DatasourceConfiguration datasourceConfiguration) {
        if (!isEmpty(datasourceConfiguration.getProperties())
                && datasourceConfiguration.getProperties().get(0) != null
                && datasourceConfiguration.getProperties().get(0).getValue() != null) {
            ArrayList<String> temp = (ArrayList) datasourceConfiguration.getProperties().get(0).getValue();
            return new HashSet<String>(temp);
        }
        return null;
    }

    public static Map<String, String> getSpreadsheetData(JsonNode file, Set<String> userAuthorizedSheetIds) {
        if (userAuthorizedSheetIds == null) {
            return extractSheetData((JsonNode) file);
        }

        String fileId = file.get("id").asText();
        // This will filter out and send only authorised google sheet files to client
        if (userAuthorizedSheetIds.contains(fileId)) {
            return extractSheetData((JsonNode) file);
        }

        return null;
    }

    private static Map<String, String> extractSheetData(JsonNode file) {
        final String spreadSheetUrl = "https://docs.google.com/spreadsheets/d/" + file.get("id").asText() + "/edit";
        return Map.of("label", file.get("name").asText(),
                "value", spreadSheetUrl);
    }
}
