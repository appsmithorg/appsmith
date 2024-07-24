package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CommonConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoadShift {
    private final CommonConfig commonConfig;

    public <T> Mono<T> subscribeOnElasticPublishOnParallel(Mono<T> mono) {
        return mono.subscribeOn(commonConfig.elasticScheduler()).publishOn(commonConfig.parallelScheduler());
    }
}
