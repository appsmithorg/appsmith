package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.repositories.DatasourceStorageStructureRepository;
import com.mongodb.client.result.UpdateResult;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@AllArgsConstructor
@Service
public class DatasourceStructureServiceCEImpl implements DatasourceStructureServiceCE {

    protected final DatasourceStorageStructureRepository repository;

    @Override
    public Mono<DatasourceStorageStructure> getByDatasourceIdAndEnvironmentId(
            String datasourceId, String environmentId) {
        return repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId);
    }

    @Override
    public Mono<DatasourceStorageStructure> save(DatasourceStorageStructure datasourceStorageStructure) {
        return repository.save(datasourceStorageStructure);
    }

    @Override
    public Mono<UpdateResult> saveStructure(String datasourceId, String environmentId, DatasourceStructure structure) {
        return repository.updateStructure(datasourceId, environmentId, structure);
    }
}
