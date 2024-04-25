package com.appsmith.server.configurations;

import com.appsmith.server.dtos.DeploymentInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Getter
@Slf4j
public class DeploymentPropertiesCE {

    private final String INFO_JSON_PATH = "/tmp/appsmith/infra.json";
    private String cloudProvider;
    private String tool;
    private String efs;
    private String hostname;
    private String deployedAt;

    public String getEdition() {
        return "CE";
    }

    public DeploymentPropertiesCE(ObjectMapper objectMapper) {
        try {
            Path infoJsonPath = Paths.get(INFO_JSON_PATH);
            if (Files.exists(infoJsonPath)) {
                String jsonContent = Files.readString(infoJsonPath);
                // Parse JSON content using the AppsmithInfo class
                DeploymentInfo deploymentInfo = objectMapper.readValue(jsonContent, DeploymentInfo.class);
                cloudProvider = deploymentInfo.getCloudProvider();
                tool = deploymentInfo.getTool();
                efs = deploymentInfo.getEfs();
                hostname = deploymentInfo.getHostname();
                deployedAt = deploymentInfo.getCurrentTime();
            }
        } catch (IOException e) {
            log.debug("Error reading deployment properties from {} {}", INFO_JSON_PATH, e.getMessage());
        }
    }
}
