package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeaturesRequestDTO {
    private String instanceId;
    private String tenantId;
    private String appsmithVersion;
    private Boolean isCloudHosting;
}
