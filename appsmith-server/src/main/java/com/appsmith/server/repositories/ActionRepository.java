package com.appsmith.server.repositories;

import com.appsmith.server.domains.Action;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.Set;

@Repository
public interface ActionRepository extends BaseRepository<Action, String>, CustomActionRepository {

    Flux<Action> findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(
            Set<String> names, String pageId, String httpMethod);

    Flux<Action> findDistinctActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId);

}
