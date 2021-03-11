package com.appsmith.server.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class GoogleRecaptchaConfig {
    
    @Value("${google.recaptcha.key.site}")
    private String siteKey;

    @Value("${google.recaptcha.key.secret}")
    private String secretKey;

}
