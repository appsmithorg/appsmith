package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.domains.*;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class DatasourceStorageStructureRepositoryCake {
    private final DatasourceStorageStructureRepository repository;

    // From CrudRepository
    public Mono<DatasourceStorageStructure> save(DatasourceStorageStructure entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<DatasourceStorageStructure> saveAll(Iterable<DatasourceStorageStructure> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<DatasourceStorageStructure> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<UpdateResult> updateStructure(
            String datasourceId, String environmentId, DatasourceStructure structure) {
        return Mono.justOrEmpty(repository.updateStructure(datasourceId, environmentId, structure));
    }

    public Mono<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(
            String datasourceId, String environmentId) {
        return Mono.justOrEmpty(repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId));
    }

    public Mono<DatasourceStorageStructure> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Mono<DatasourceStorageStructure> archive(DatasourceStorageStructure entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
