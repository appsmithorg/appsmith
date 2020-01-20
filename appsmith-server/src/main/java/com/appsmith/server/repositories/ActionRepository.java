package com.appsmith.server.repositories;

import com.appsmith.server.domains.Action;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

@Repository
public interface ActionRepository extends BaseRepository<Action, String> {

    Mono<Action> findById(String id);

    Mono<Action> findByNameAndPageId(String name, String pageId);

    Flux<Action> findDistinctActionsByNameInAndPageId(Set<String> names, String pageId);

    Flux<Action> findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(Set<String> names, String pageId, String httpMethod);

    Flux<Action> saveAll(List<Action> actions);

}
