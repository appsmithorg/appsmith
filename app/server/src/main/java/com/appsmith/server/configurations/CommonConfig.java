package com.appsmith.server.configurations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Configuration
public class CommonConfig {

    private String ELASTIC_THREAD_POOL_NAME = "appsmith-elastic-pool";

    @Bean
    public Scheduler scheduler() {
        return Schedulers.newElastic(ELASTIC_THREAD_POOL_NAME);
    }

}
