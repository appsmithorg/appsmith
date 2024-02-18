package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Action;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomActionRepository;
import org.springframework.data.mongodb.repository.Meta;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ActionRepositoryCE extends BaseRepository<Action, String>, CustomActionRepository {

    @Meta(cursorBatchSize = 10000)
    Flux<Action> findByApplicationId(String applicationId);

    @Meta(cursorBatchSize = 10000)
    Flux<Action> findAllByIdIn(Iterable<String> ids);

    Mono<Long> countByDeletedAtNull();
}
