/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceConfigurationStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

public interface DatasourceConfigurationStructureServiceCE {

  Mono<DatasourceConfigurationStructure> getByDatasourceId(String datasourceId);

  Mono<DatasourceConfigurationStructure> save(
      DatasourceConfigurationStructure datasourceConfigurationStructure);

  Mono<UpdateResult> saveStructure(String datasourceId, DatasourceStructure structure);
}
