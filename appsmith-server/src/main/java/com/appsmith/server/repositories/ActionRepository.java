package com.appsmith.server.repositories;

import com.appsmith.server.domains.Action;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

@Repository
public interface ActionRepository extends BaseRepository<Action, String> {

    Mono<Action> findByNameAndPageId(String name, String pageId);

    Flux<Action> findByPageId(String pageId);

    Flux<Action> findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(Set<String> names, String pageId, String httpMethod);
}
