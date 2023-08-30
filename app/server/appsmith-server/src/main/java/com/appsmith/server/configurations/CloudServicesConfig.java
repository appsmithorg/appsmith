package com.appsmith.server.configurations;

import com.appsmith.server.configurations.ce.CloudServicesConfigCE;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class CloudServicesConfig extends CloudServicesConfigCE {
    private String baseUrl;

    @Value("${appsmith.cloud_services.username}")
    private String username;

    @Value("${appsmith.cloud_services.password}")
    private String password;

    @Autowired
    public void setBaseUrl(@Value("${appsmith.cloud_services.base_url:}") String value) {
        baseUrl = StringUtils.isEmpty(value) ? "https://cs.appsmith.com" : value;
    }
}
