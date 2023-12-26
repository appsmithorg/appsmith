package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.domains.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.cakes.BaseCake;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class DatasourceStorageStructureRepositoryCake extends BaseCake<DatasourceStorageStructure> {
    private final DatasourceStorageStructureRepository repository;

    public DatasourceStorageStructureRepositoryCake(DatasourceStorageStructureRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<DatasourceStorageStructure> saveAll(Iterable<DatasourceStorageStructure> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<DatasourceStorageStructure> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<DatasourceStorageStructure> archive(DatasourceStorageStructure entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(
            String datasourceId, String environmentId) {
        return Mono.defer(
                () -> Mono.justOrEmpty(repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId)));
    }

    public Mono<DatasourceStorageStructure> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<UpdateResult> updateStructure(
            String datasourceId, String environmentId, DatasourceStructure structure) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateStructure(datasourceId, environmentId, structure)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
