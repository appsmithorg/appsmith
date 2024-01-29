package com.appsmith.server.repositories.cakes;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.BaseRepository;
import com.querydsl.core.types.Predicate;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RequiredArgsConstructor
public abstract class BaseCake<T extends BaseDomain> {
    private final EntityManager entityManager;
    private final BaseRepository<T, String> repository;

    public Mono<T> save(T entity) {
        return Mono.fromSupplier(() -> repository.save(entity)).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<T> findById(String id) {
        return Mono.fromSupplier(() -> repository.findById(id).orElse(null)).subscribeOn(Schedulers.boundedElastic());
    }

    public Flux<T> findAllById(Iterable<String> ids) {
        return Mono.fromSupplier(() -> repository.findAllById(ids))
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<T> updateById(String id, T entity, AclPermission permission) {
        // TODO: Implement this method.
        return Mono.just(entity);
    }

    // TODO: This should be soft delete, not hard delete.
    public Mono<Void> deleteAll() {
        return Mono.<Void>fromRunnable(repository::deleteAll).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Void> deleteById(String id) {
        return Mono.<Void>fromRunnable(() -> repository.deleteById(id)).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Void> delete(T entity) {
        return Mono.<Void>fromRunnable(() -> repository.delete(entity)).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Long> count() {
        return Mono.fromSupplier(repository::count).subscribeOn(Schedulers.boundedElastic());
    }

    // ---------------------------------------------------
    // Wrappers for methods from QuerydslPredicateExecutor
    // ---------------------------------------------------

    public Mono<T> findOne(Predicate predicate) {
        return Mono.fromSupplier(() -> repository.findOne(predicate).orElse(null))
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Flux<T> findAll(Predicate predicate) {
        return Mono.fromSupplier(() -> repository.findAll(predicate))
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }
}
