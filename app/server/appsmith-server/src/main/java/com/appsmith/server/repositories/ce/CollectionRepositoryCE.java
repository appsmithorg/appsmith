package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomCollectionRepository;
import reactor.core.publisher.Mono;

public interface CollectionRepositoryCE extends BaseRepository<Collection, String>, CustomCollectionRepository {
    Mono<Collection> findById(String id);
}
