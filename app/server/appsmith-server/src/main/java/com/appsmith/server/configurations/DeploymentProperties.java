package com.appsmith.server.configurations;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class DeploymentProperties extends DeploymentPropertiesCE {
    public DeploymentProperties(ObjectMapper objectMapper) {
        super(objectMapper);
    }
}
