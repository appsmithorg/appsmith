package com.appsmith.server.configurations;

import lombok.Data;

@Data
public class InstallationPropertiesCE {

    private final String INFO_JSON_PATH = "/tmp/appsmith/infra.json";
    private String cloudProvider;
    private String tool;
    private String efs;
    private String hostname;
    private String currentTime;

    public String getEdition() {
        return "CE";
    }
}
