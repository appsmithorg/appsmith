package com.appsmith.server.repositories;

import com.appsmith.server.domains.Action;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ActionRepository extends BaseRepository<Action, String> {

    Mono<Action> findById(String id);

    Flux<Action> findAllByOrderByName();

    Mono<Action> findByName(String name);
}
