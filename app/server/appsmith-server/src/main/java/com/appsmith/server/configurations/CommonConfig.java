package com.appsmith.server.configurations;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import javax.validation.Validation;
import javax.validation.Validator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Configuration
public class CommonConfig {

    private static final String ELASTIC_THREAD_POOL_NAME = "appsmith-elastic-pool";

    @Value("${signup.disabled}")
    private boolean isSignupDisabled;

    @Value("${admin.emails}")
    private Set<String> adminEmails = Collections.emptySet();

    @Value("${oauth2.allowed-domains}")
    private String allowedDomainsForOauthString;

    private List<String> allowedDomainsForOauth;

    @Value("${signup.allowed-domains}")
    private String allowedDomainsString;

    // Is this instance hosted on Appsmith cloud?
    // isCloudHosted should be true only for our cloud instance
    @Value("${is.cloud-hosted:false}")
    private boolean isCloudHosted;

    @Value("${github_repo}")
    private String repo;


    private List<String> allowedDomains;

    @Bean
    public Scheduler scheduler() {
        return Schedulers.newElastic(ELASTIC_THREAD_POOL_NAME);
    }

    @Bean
    public Validator validator() {
        return Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return objectMapper;
    }

    public List<String> getOauthAllowedDomains() {
        if (allowedDomainsForOauth == null) {
            allowedDomainsForOauth = StringUtils.hasText(allowedDomainsForOauthString)
                    ? Arrays.asList(allowedDomainsForOauthString.trim().split("\\s*,[,\\s]*"))
                    : new ArrayList<>();
            allowedDomainsForOauth.addAll(getAllowedDomains());
        }

        return allowedDomainsForOauth;
    }

    public List<String> getAllowedDomains() {
        if (allowedDomains == null) {
            allowedDomains = StringUtils.hasText(allowedDomainsString)
                    ? Arrays.asList(allowedDomainsString.trim().split("\\s*,[,\\s]*"))
                    : Collections.emptyList();
        }

        return allowedDomains;
    }

}
