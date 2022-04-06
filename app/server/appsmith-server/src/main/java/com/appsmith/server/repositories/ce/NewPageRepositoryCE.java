package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNewPageRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NewPageRepositoryCE extends BaseRepository<NewPage, String>, CustomNewPageRepository {

    Flux<NewPage> findByApplicationId(String applicationId);

    Mono<Long> countByDeletedAtNull();

}
