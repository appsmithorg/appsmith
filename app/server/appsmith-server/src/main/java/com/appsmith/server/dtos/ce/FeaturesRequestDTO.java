package com.appsmith.server.dtos.ce;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeaturesRequestDTO {
    private String instanceId;
    private String tenantId;
    private String appsmithVersion;
}
