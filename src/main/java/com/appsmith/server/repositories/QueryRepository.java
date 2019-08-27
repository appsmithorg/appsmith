package com.appsmith.server.repositories;

import com.appsmith.server.domains.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface QueryRepository extends BaseRepository<Query, String> {

    Mono<Query> findByName(String name);
}
