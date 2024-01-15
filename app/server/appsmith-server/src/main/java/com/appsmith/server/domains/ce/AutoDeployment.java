package com.appsmith.server.domains.ce;

import lombok.Data;

import java.time.Instant;

@Data
public class AutoDeployment {
    private Boolean enabled = Boolean.FALSE;
    private Instant lastDeployedAt;
    private String branchName;
}
