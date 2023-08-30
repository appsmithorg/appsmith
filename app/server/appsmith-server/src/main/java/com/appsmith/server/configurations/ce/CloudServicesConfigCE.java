package com.appsmith.server.configurations.ce;

import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

@Getter
public class CloudServicesConfigCE {

    private String baseUrl;

    @Autowired
    public void setBaseUrl(@Value("${appsmith.cloud_services.base_url:}") String value) {
        baseUrl = StringUtils.isEmpty(value) ? "https://cs.appsmith.com" : value;
    }

    public String getBaseUrlWithSignatureVerification() {
        return this.getBaseUrl();
    }
}
