package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Mono;

public interface ApplicationSnapshotRepositoryCE extends BaseRepository<ApplicationSnapshot, String> {
    Mono<ApplicationSnapshot> findByApplicationId(String applicationId);
}
