package com.appsmith.server.repositories;

import com.appsmith.server.domains.Collection;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface CollectionRepository extends BaseRepository<Collection, String>, CustomCollectionRepository {
    Mono<Collection> findById(String id);
}
