package com.appsmith.server.migrations;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class FileUtils {
    public static String loadSQLFileAsString(String filePath) throws IOException {
        StringBuilder stringBuilder = new StringBuilder();
        // Load the SQL file from resources
        try (InputStream inputStream = FileUtils.class.getResourceAsStream(filePath);
                BufferedReader reader =
                        new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

            String line;
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line).append("\n");
            }
        }
        return stringBuilder.toString();
    }
}
