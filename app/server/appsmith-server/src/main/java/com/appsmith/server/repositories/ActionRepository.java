package com.appsmith.server.repositories;

import com.appsmith.server.domains.Action;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

@Repository
public interface ActionRepository extends BaseRepository<Action, String>, CustomActionRepository {

    Flux<Action> findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(
            Set<String> names, String pageId, String httpMethod);

    Flux<Action> findDistinctActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId);

    Mono<Long> countByDatasourceId(String datasourceId);

    Flux<Action> findByPageId(String pageId);

    Flux<Action> findByOrganizationId(String organizationId);
}
