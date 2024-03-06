package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.ce.NewActionRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface NewActionRepository extends NewActionRepositoryCE, CustomNewActionRepository {
    Flux<NewAction> findByPackageId(String id);
}
