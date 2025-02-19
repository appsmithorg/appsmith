package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeaturesRequestDTO {
    private String instanceId;
    private String organizationId;
    private String appsmithVersion;
    private Boolean isCloudHosting;
}
