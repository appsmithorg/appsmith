package com.appsmith.server.helpers;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.util.Optional;
import java.util.function.Supplier;

import static com.appsmith.server.constants.ce.FieldNameCE.TRANSACTION_THREAD_NAME;

public class ReactorUtils {
    private ReactorUtils() {}

    private static final String ELASTIC_THREAD_POOL_NAME = "appsmith-db-elastic-pool";

    private static final int maxThreadCount = System.getenv("APPSMITH_DB_ELASTIC_THREAD_MAX_VALUE") != null
            ? Integer.parseInt(System.getenv("APPSMITH_DB_ELASTIC_THREAD_MAX_VALUE"))
            : 300;

    /*
     * This scheduler is used to run for all the db ops
     * The number of threads is set to 300, and the queue size is set to the default value
     * The reason for the higher number 300 is
     * to support the cache evictions flow used in PermissionGroupCEImpl class
     * TODO : We need to revisit this number and see if we can reduce it by modifying the cache eviction flow to accept List of users
     */
    public static final Scheduler elasticScheduler = Schedulers.newBoundedElastic(
            maxThreadCount, Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE, ELASTIC_THREAD_POOL_NAME);

    public static <T> Mono<T> asMono(Supplier<Optional<T>> supplier) {
        Mono<Scheduler> schedulerMono =
                Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TRANSACTION_THREAD_NAME, elasticScheduler)));
        return schedulerMono
                .flatMap(scheduler ->
                        switchToElasticScheduler(scheduler).then(Mono.defer(() -> Mono.justOrEmpty(supplier.get()))))
                .publishOn(Schedulers.boundedElastic());
    }

    public static <T> Mono<T> asMonoDirect(Supplier<T> supplier) {
        Mono<Scheduler> schedulerMono =
                Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TRANSACTION_THREAD_NAME, elasticScheduler)));
        return schedulerMono
                .flatMap(scheduler ->
                        switchToElasticScheduler(scheduler).then(Mono.defer(() -> Mono.justOrEmpty(supplier.get()))))
                .publishOn(Schedulers.boundedElastic());
    }

    public static <T> Flux<T> asFlux(Supplier<? extends Iterable<T>> supplier) {
        Mono<Scheduler> schedulerMono =
                Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TRANSACTION_THREAD_NAME, elasticScheduler)));
        return schedulerMono
                .flatMapMany(scheduler -> switchToElasticScheduler(scheduler)
                        .then(Mono.fromCallable(supplier::get))
                        .flatMapMany(Flux::fromIterable))
                .publishOn(Schedulers.boundedElastic());
    }

    private static Mono<Void> switchToElasticScheduler(Scheduler scheduler) {
        return Mono.defer(() -> Mono.empty().publishOn(scheduler)).then();
    }
}
