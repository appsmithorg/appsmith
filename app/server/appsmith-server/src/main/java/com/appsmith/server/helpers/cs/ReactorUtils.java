package com.appsmith.server.helpers.cs;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Optional;
import java.util.function.Supplier;

public class ReactorUtils {
    private ReactorUtils() {}

    public static <T> Mono<T> toMono(Supplier<Optional<T>> supplier) {
        return Mono.defer(() -> Mono.justOrEmpty(supplier.get())).subscribeOn(Schedulers.boundedElastic());
    }

    public static <T> Flux<T> toFlux(Supplier<? extends Iterable<T>> supplier) {
        return Mono.fromSupplier(supplier).flatMapMany(Flux::fromIterable).subscribeOn(Schedulers.boundedElastic());
    }
}
