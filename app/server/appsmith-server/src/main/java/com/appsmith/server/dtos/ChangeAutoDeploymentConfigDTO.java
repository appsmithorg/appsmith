package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeAutoDeploymentConfigDTO {
    @NotNull private String branchName;

    @NotNull private Boolean enabled;
}
