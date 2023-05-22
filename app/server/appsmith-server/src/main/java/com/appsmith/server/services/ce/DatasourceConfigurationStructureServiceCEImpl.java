/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceConfigurationStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.repositories.DatasourceConfigurationStructureRepository;
import com.mongodb.client.result.UpdateResult;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@AllArgsConstructor
@Service
public class DatasourceConfigurationStructureServiceCEImpl
    implements DatasourceConfigurationStructureServiceCE {

  protected final DatasourceConfigurationStructureRepository repository;

  @Override
  public Mono<DatasourceConfigurationStructure> getByDatasourceId(String datasourceId) {
    return repository.findByDatasourceId(datasourceId);
  }

  @Override
  public Mono<DatasourceConfigurationStructure> save(
      DatasourceConfigurationStructure datasourceConfigurationStructure) {
    return repository.save(datasourceConfigurationStructure);
  }

  @Override
  public Mono<UpdateResult> saveStructure(String datasourceId, DatasourceStructure structure) {
    return repository.updateStructure(datasourceId, structure);
  }
}
