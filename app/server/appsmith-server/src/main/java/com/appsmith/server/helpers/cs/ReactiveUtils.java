package com.appsmith.server.helpers.cs;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Optional;
import java.util.function.Supplier;

public class ReactiveUtils {
    private ReactiveUtils() {}

    public static <T> Mono<T> nonBlocking(Supplier<Optional<T>> supplier) {
        return Mono.fromSupplier(() -> supplier.get().orElse(null)).subscribeOn(Schedulers.boundedElastic());
    }
}
