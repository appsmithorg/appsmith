package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Action;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomActionRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

@Repository
public interface ActionRepositoryCE extends BaseRepository<Action, String>, CustomActionRepository {

    Flux<Action> findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethodAndUserSetOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad);

    Flux<Action> findDistinctActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId);

    Mono<Long> countByDatasourceId(String datasourceId);

    Flux<Action> findByPageId(String pageId);

    Flux<Action> findByOrganizationId(String organizationId);
}
