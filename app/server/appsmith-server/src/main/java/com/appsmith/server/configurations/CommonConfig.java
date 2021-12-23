package com.appsmith.server.configurations;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Configuration
public class CommonConfig {

    private static final String ELASTIC_THREAD_POOL_NAME = "appsmith-elastic-pool";

    @Value("${appsmith.instance.name:}")
    private String instanceName;

    @Value("${signup.disabled}")
    private boolean isSignupDisabled;

    @Setter(AccessLevel.NONE)
    private Set<String> adminEmails = Collections.emptySet();

    @Value("${oauth2.allowed-domains}")
    private String allowedDomainsForOauthString;

    private List<String> allowedDomainsForOauth;

    @Value("${signup.allowed-domains}")
    private String allowedDomainsString;

    // Is this instance hosted on Appsmith cloud?
    // isCloudHosting should be true only for our cloud instance
    @Value("${is.cloud-hosting:false}")
    private boolean isCloudHosting;

    @Value("${github_repo}")
    private String repo;

    @Value("${appsmith.admin.envfile:}")
    public String envFilePath;

    @Value("${disable.telemetry:true}")
    private boolean isTelemetryDisabled;

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
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return objectMapper;
    }

    public List<String> getOauthAllowedDomains() {
        if (allowedDomainsForOauth == null) {
            final Set<String> domains = new HashSet<>();
            if (StringUtils.hasText(allowedDomainsForOauthString)) {
                domains.addAll(Arrays.asList(allowedDomainsForOauthString.trim().split("\\s*,[,\\s]*")));
            }
            domains.addAll(getAllowedDomains());
            allowedDomainsForOauth = new ArrayList<>(domains);
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

    @Autowired
    public void setAdminEmails(@Value("${admin.emails}") String value) {
        adminEmails = Set.of(value.trim().split("\\s*,\\s*"));
    }

}
