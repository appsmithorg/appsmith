package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CommonConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * This class is used configure the load shifts for the Monos.
 * The schedulers which  are configured in the CommonConfig class.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LoadShifter {
    private final CommonConfig commonConfig;

    /**
     * This method is used to shift the subscription from the current thread to the elastic scheduler
     * and then publish the result on the parallel scheduler.
     * @param mono The mono to be shifted.
     *             This mono will be subscribed on the elastic scheduler and the result will be published on the parallel scheduler.
     * @param message The message to be logged.
     * @return The shifted mono.
     * @param <T> The type of the mono.
     */
    public <T> Mono<T> subscribeOnElasticPublishOnParallel(Mono<T> mono, String message) {
        return mono.doOnSubscribe(__ -> log.debug("Shifting load for {} to elastic scheduler", message))
                .subscribeOn(commonConfig.elasticScheduler())
                .publishOn(commonConfig.parallelScheduler())
                .doOnSuccess(__ -> log.debug("Load shifted for {} to parallel scheduler", message))
                .doOnError(
                        error -> log.error("Error while shifting load for {} to parallel scheduler", message, error));
    }

    /**
     * This method is used to shift the subscription from the current thread to the elastic scheduler.
     * @param mono The mono to be shifted.
     *             This mono will be subscribed on the elastic scheduler.
     * @param message The message to be logged.
     * @return The shifted mono.
     * @param <T> The type of the mono.
     */
    public <T> Mono<T> subscribeOnElastic(Mono<T> mono, String message) {
        return mono.doOnSubscribe(__ -> log.debug("Shifting load for {} to elastic scheduler", message))
                .subscribeOn(commonConfig.elasticScheduler());
    }
}
