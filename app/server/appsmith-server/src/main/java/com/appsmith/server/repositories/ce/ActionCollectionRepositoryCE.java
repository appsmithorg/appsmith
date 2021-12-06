package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomActionCollectionRepository;
import reactor.core.publisher.Flux;

public interface ActionCollectionRepositoryCE extends BaseRepository<ActionCollection, String>, CustomActionCollectionRepository {
    Flux<ActionCollection> findByApplicationId(String applicationId);
}
