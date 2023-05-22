/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import reactor.core.publisher.Mono;

public interface DatasourceStructureSolutionCE {

  Mono<DatasourceStructure> getStructure(
      String datasourceId, boolean ignoreCache, String environmentName);

  Mono<DatasourceStructure> getStructure(
      Datasource datasource, boolean ignoreCache, String environmentName);
}
