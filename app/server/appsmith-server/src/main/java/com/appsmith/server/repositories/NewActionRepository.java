package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewAction;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

@Repository
public interface NewActionRepository extends BaseRepository<NewAction, String>, CustomNewActionRepository {
    Flux<NewAction> findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethodAndUserSetOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad);

    Flux<NewAction> findDistinctActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId);

    Mono<Long> countByDatasourceId(String datasourceId);

    Flux<NewAction> findByPageId(String pageId);
}
