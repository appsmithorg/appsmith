package com.appsmith.server.dtos;

import lombok.Data;

import java.time.Instant;

@Data
public class GitDeployApplicationResultDTO {
    private String applicationName;
    private String branchName;
    private String applicationId;
    private Instant deployedAt;
    private String repoUrl;
}
