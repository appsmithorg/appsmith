package com.appsmith.server.configurations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import javax.validation.Validation;
import javax.validation.Validator;

@Configuration
public class CommonConfig {

    private String ELASTIC_THREAD_POOL_NAME = "appsmith-elastic-pool";

    @Bean
    public Scheduler scheduler() {
        return Schedulers.newElastic(ELASTIC_THREAD_POOL_NAME);
    }

    @Bean
    public Validator validator() {
        return Validation.buildDefaultValidatorFactory().getValidator();
    }
}
