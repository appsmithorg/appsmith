package com.appsmith.server.repositories;

import com.appsmith.server.domains.Resource;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface ResourceRepository extends BaseRepository<Resource, String> {
    Mono<Resource> findByName(String name);
}
