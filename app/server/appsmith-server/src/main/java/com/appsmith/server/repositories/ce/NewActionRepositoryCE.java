package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNewActionRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NewActionRepositoryCE extends BaseRepository<NewAction, String>, CustomNewActionRepository {

    Flux<NewAction> findByApplicationId(String applicationId);

    Mono<Long> countByDeletedAtNull();

}
