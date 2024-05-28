package com.appsmith.server.helpers;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Optional;
import java.util.function.Supplier;

public class ReactorUtils {
    private ReactorUtils() {}

    public static <T> Mono<T> asMono(Supplier<Optional<T>> supplier) {
        return Mono.defer(() -> Mono.justOrEmpty(supplier.get())).subscribeOn(Schedulers.boundedElastic());
    }

    public static <T> Mono<T> asMonoDirect(Supplier<T> supplier) {
        return Mono.defer(() -> Mono.justOrEmpty(supplier.get())).subscribeOn(Schedulers.boundedElastic());
    }

    public static <T> Flux<T> asFlux(Supplier<? extends Iterable<T>> supplier) {
        return Mono.fromSupplier(supplier).flatMapMany(Flux::fromIterable).subscribeOn(Schedulers.boundedElastic());
    }

    /*
    private static <T> Mono<T> addContext(Mono<T> mono) {
        return ReactiveSecurityContextHolder.getContext()
            .flatMap(ctx -> mono.contextWrite(Context.of(ReactiveSecurityContextHolder.class, ctx)))
            .switchIfEmpty(mono);
    }

    private static <T> Flux<T> addContext(Flux<T> flux) {
        return ReactiveSecurityContextHolder.getContext()
            .flatMapMany(ctx -> flux.contextWrite(Context.of(ReactiveSecurityContextHolder.class, Mono.just(ctx))))
            .switchIfEmpty(flux);
    }

     */
}
