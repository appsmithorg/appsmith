/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomApplicationRepository;
import java.util.List;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ApplicationRepositoryCE
    extends BaseRepository<Application, String>, CustomApplicationRepository {

  Flux<Application> findByIdIn(List<String> ids);

  Flux<Application> findByWorkspaceId(String workspaceId);

  Flux<Application> findByClonedFromApplicationId(String clonedFromApplicationId);

  Mono<Long> countByDeletedAtNull();

  Mono<Application> findByIdAndExportWithConfiguration(String id, boolean exportWithConfiguration);
}
