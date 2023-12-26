package com.appsmith.server.repositories.cakes;

import com.appsmith.external.models.BaseDomain;
import lombok.RequiredArgsConstructor;
import org.springframework.data.repository.CrudRepository;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public abstract class BaseCake<T extends BaseDomain> {
    private final CrudRepository<T, String> repository;

    public Mono<T> save(T entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.save(entity)));
    }
}
