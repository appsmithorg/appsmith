package com.appsmith.server.configurations;

import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class CloudServicesConfig {
    private String baseUrl;

    @Value("${appsmith.cloud_services.username}")
    private String username;

    @Value("${appsmith.cloud_services.password}")
    private String password;

    @Value("${appsmith.cloud_services.template_upload_auth_header}")
    private String templateUploadAuthHeader;

    @Autowired
    public void setBaseUrl(@Value("${appsmith.cloud_services.base_url:}") String value) {
        baseUrl = StringUtils.isEmpty(value) ? "https://cs.appsmith.com" : value;
    }

    @Value("${appsmith.cloud_services.signature_base_url}")
    String baseUrlWithSignatureVerification;

    public String getBaseUrlWithSignatureVerification() {
        return StringUtils.isEmpty(this.baseUrlWithSignatureVerification)
                ? this.getBaseUrl()
                : this.baseUrlWithSignatureVerification;
    }
}
