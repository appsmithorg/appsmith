package com.appsmith.server.configurations;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class dedicated for airgap instance setting. We have to create a separate class instead of adding
 * fields in InstanceConfig to avoid any cyclical dependency exception.
 */
@Configuration
@Getter
@Setter
public class AirgapInstanceConfig {

    @Value("${airgap.enabled:false}")
    private boolean isAirgapEnabled;

}
