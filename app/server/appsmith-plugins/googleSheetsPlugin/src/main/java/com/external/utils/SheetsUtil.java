package com.external.utils;

import java.util.regex.Pattern;

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
}
