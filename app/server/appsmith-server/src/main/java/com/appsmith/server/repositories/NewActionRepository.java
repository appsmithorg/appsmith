package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewAction;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface NewActionRepository extends BaseRepository<NewAction, String>, CustomNewActionRepository {

    Flux<NewAction> findByApplicationId(String applicationId);

}
