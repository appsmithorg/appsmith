package com.appsmith.server.repositories;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.ce.ActionCollectionRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ActionCollectionRepository extends CustomActionCollectionRepository, ActionCollectionRepositoryCE {
    Flux<ActionCollection> findByPackageId(String packageId);
}
