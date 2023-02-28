package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ApplicationSnapshotRepositoryCE extends CustomApplicationSnapshotRepositoryCE, BaseRepository<ApplicationSnapshot, String> {
    Flux<ApplicationSnapshot> findByApplicationId(String applicationId);
    Mono<Void> deleteAllByApplicationId(String applicationId);
}
