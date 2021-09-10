package com.appsmith.server.repositories;

import com.appsmith.server.domains.ActionCollection;
import reactor.core.publisher.Flux;

public interface ActionCollectionRepository extends BaseRepository<ActionCollection, String>, CustomActionCollectionRepository {

    Flux<ActionCollection> findByApplicationId(String applicationId);
}
