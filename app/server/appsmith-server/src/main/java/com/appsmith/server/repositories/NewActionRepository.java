package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewAction;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NewActionRepository extends BaseRepository<NewAction, String>, CustomNewActionRepository {

    Mono<Long> countByDatasourceId(String datasourceId);

    Flux<NewAction> findByPageId(String pageId);

    Flux<NewAction> findByApplicationId(String applicationId);
}
