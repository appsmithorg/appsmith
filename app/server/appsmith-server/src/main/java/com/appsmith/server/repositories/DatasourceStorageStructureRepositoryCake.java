package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
import com.appsmith.external.models.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.data.mongodb.core.query.*;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.InsertManyResult;
import com.querydsl.core.types.dsl.StringPath;
import com.mongodb.client.result.UpdateResult;

import java.util.*;

@Component
@RequiredArgsConstructor
public class DatasourceStorageStructureRepositoryCake {
    private final DatasourceStorageStructureRepository repository;

    // From CrudRepository
    public Mono<DatasourceStorageStructure> save(DatasourceStorageStructure entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.save(entity)));
    }
    public Flux<DatasourceStorageStructure> saveAll(Iterable<DatasourceStorageStructure> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }
    public Mono<DatasourceStorageStructure> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<UpdateResult> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateStructure(datasourceId, environmentId, structure)));
    }

    public Mono<DatasourceStorageStructure> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<DatasourceStorageStructure> archive(DatasourceStorageStructure entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

}
