package com.appsmith.server.configurations;

import com.appsmith.server.dtos.BuildInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@Getter
@Slf4j
public class ProjectProperties {

    public static final String EDITION = "CE";
    private String version = "UNKNOWN";
    private static final String INFO_JSON_PATH = "/opt/appsmith/info.json";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public String getVersion() {
        // Check if the version is "UNKNOWN" and attempt to read from /opt/appsmith/info.json
        if ("UNKNOWN".equals(version)) {
            try {
                Path infoJsonPath = Paths.get(INFO_JSON_PATH);
                if (Files.exists(infoJsonPath)) {
                    String jsonContent = Files.readString(infoJsonPath);
                    // Parse JSON content using the AppsmithInfo class
                    BuildInfo appsmithInfo = objectMapper.readValue(jsonContent, BuildInfo.class);
                    version = appsmithInfo.getVersion();
                    return appsmithInfo.getVersion();
                }
            } catch (IOException e) {
                // Ignore the exception and return "UNKNOWN" as the version
                log.debug("Error reading version from info.json {}", e.getMessage());
            }
        }
        return version;
    }
}
