package com.appsmith.server.helpers;

import org.springframework.transaction.TransactionStatus;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.util.Optional;
import java.util.function.Supplier;

public class ReactorUtils {
    private ReactorUtils() {}

    private static final String ELASTIC_THREAD_POOL_NAME = "appsmith-db-elastic-pool";

    /*
     * This scheduler is used to run for all the db ops
     * The number of threads is set to 300, and the queue size is set to the default value
     * The reason for the higher number 300 is
     * to support the cache evictions flow used in PermissionGroupCEImpl class
     * TODO : We need to revisit this number and see if we can reduce it by modifying the cache eviction flow to accept List of users
     */
    public static final Scheduler elasticScheduler =
            Schedulers.newBoundedElastic(300, Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE, ELASTIC_THREAD_POOL_NAME);

    public static <T> Mono<T> asMono(Supplier<Optional<T>> supplier) {
        return Mono.defer(() -> Mono.justOrEmpty(supplier.get())).subscribeOn(elasticScheduler);
    }

    public static <T> Mono<T> asMonoTransaction(Supplier<Optional<T>> supplier) {

        return Mono.deferContextual(ctx -> {
                    // Retrieve the transaction from the Reactor context
                    TransactionStatus transactionStatus = ctx.get(TransactionStatus.class);

                    // Simulate further processing and ensure it runs within the same transaction
                    return Mono.justOrEmpty(supplier.get());
                })
                .subscribeOn(elasticScheduler);
    }

    public static <T> Mono<T> asMonoDirect(Supplier<T> supplier) {
        return Mono.defer(() -> Mono.justOrEmpty(supplier.get())).subscribeOn(elasticScheduler);
    }

    public static <T> Flux<T> asFlux(Supplier<? extends Iterable<T>> supplier) {
        return Mono.fromCallable(supplier::get).flatMapMany(Flux::fromIterable).subscribeOn(elasticScheduler);
    }
}
