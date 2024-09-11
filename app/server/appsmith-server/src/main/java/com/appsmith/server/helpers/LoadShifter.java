package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

/**
 * This class is used configure the load shifts for the Monos.
 * The schedulers which  are configured in the CommonConfig class.
 */
@Slf4j
public class LoadShifter {
    private static final String PARALLEL_THREAD_POOL_NAME = "appsmith-parallel-pool";
    private static final String ELASTIC_THREAD_POOL_NAME = "appsmith-elastic-pool";
    public static final Scheduler parallelScheduler = Schedulers.newParallel(PARALLEL_THREAD_POOL_NAME);

    public static final Scheduler elasticScheduler = Schedulers.newBoundedElastic(
            Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
            Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
            ELASTIC_THREAD_POOL_NAME);

    /**
     * This method is used to shift the subscription from the current thread to the elastic scheduler
     * and then publish the result on the parallel scheduler.
     * @param mono The mono to be shifted.
     *             This mono will be subscribed on the elastic scheduler and the result will be published on the parallel scheduler.
     * @param message The message to be logged.
     * @return The shifted mono.
     * @param <T> The type of the mono.
     */
    public static <T> Mono<T> subscribeOnElasticPublishOnParallel(Mono<T> mono, String message) {
        return mono.subscribeOn(elasticScheduler).publishOn(parallelScheduler);
    }

    /**
     * This method is used to shift the subscription from the current thread to the elastic scheduler.
     * @param mono The mono to be shifted.
     *             This mono will be subscribed on the elastic scheduler.
     * @param message The message to be logged.
     * @return The shifted mono.
     * @param <T> The type of the mono.
     */
    public static <T> Mono<T> subscribeOnElastic(Mono<T> mono, String message) {
        return mono.subscribeOn(elasticScheduler);
    }
}
