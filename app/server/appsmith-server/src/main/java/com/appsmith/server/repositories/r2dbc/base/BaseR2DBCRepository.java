package com.appsmith.server.repositories.r2dbc.base;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.NoRepositoryBean;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@NoRepositoryBean
public interface BaseR2DBCRepository<T, ID> extends R2dbcRepository<T, ID> {
    Mono<T> findByIdAndDeletedAtIsNull(ID id);

    Flux<T> findAllAndDeletedAtIsNull();

    Mono<Boolean> existsByIdAndDeletedAtIsNull(ID id);
}
