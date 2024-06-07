package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeploymentInfo {
    private String cloudProvider;
    private String tool;
    private String efs;
    private String hostname;
    private String currentTime;
}
