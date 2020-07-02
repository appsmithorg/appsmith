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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@Configuration
public class CommonConfig {

    private static final String ELASTIC_THREAD_POOL_NAME = "appsmith-elastic-pool";

    @Value("${oauth2.allowed-domains}")
    private static String allowedDomainList;

    private List<String> domainList;

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

    public List<String> getAllowedDomains() {
        if (domainList == null) {
            domainList = StringUtils.hasText(allowedDomainList)
                    ? Arrays.asList(allowedDomainList.trim().split("\\s*,[,\\s]*"))
                    : Collections.emptyList();
        }

        return domainList;
    }
}
