package com.appsmith.server.repositories;

import com.appsmith.server.domains.ActionCollection;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface ActionCollectionRepository extends CustomActionCollectionRepository, ActionCollectionRepositoryCE {

    Mono<ActionCollection> findById(String id);
}
