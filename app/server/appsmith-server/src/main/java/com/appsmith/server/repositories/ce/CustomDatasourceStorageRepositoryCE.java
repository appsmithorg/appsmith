/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.AppsmithRepository;
import java.util.List;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomDatasourceStorageRepositoryCE extends AppsmithRepository<DatasourceStorage> {

  Flux<DatasourceStorage> findByDatasourceId(String datasourceId);

  Flux<DatasourceStorage> findAllByDatasourceIds(List<String> datasourceIds);

  Mono<DatasourceStorage> findOneByDatasourceId(String datasourceId);
}
