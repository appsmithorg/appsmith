package com.appsmith.server.repositories;

import com.appsmith.server.domains.Page;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface PageRepository extends BaseRepository<Page, String> {
    Mono<Page> findByIdAndLayoutsId(String id, String layoutId);

    Mono<Page> findByName(String name);

    Mono<Void> deleteAll();
}
