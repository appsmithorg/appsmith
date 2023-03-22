package com.external.utils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

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

    public static Set<String> getAuthorizedSheetIds(DatasourceConfiguration datasourceConfiguration) {
        if (datasourceConfiguration.getProperties() != null
                && datasourceConfiguration.getProperties().size() > 0
                && datasourceConfiguration.getProperties().get(0) != null
                && datasourceConfiguration.getProperties().get(0).getValue() != null) {
            ArrayList<String> temp = (ArrayList) datasourceConfiguration.getProperties().get(0).getValue();
            return new HashSet<String>(temp);
        }
        return null;
    }
}
