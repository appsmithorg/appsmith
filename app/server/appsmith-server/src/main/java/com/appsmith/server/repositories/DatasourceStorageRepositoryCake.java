package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class DatasourceStorageRepositoryCake {
    private final DatasourceStorageRepository repository;

    // From CrudRepository
    public Mono<DatasourceStorage> save(DatasourceStorage entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<DatasourceStorage> saveAll(Iterable<DatasourceStorage> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<DatasourceStorage> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public DatasourceStorage setUserPermissionsInObject(DatasourceStorage obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Flux<DatasourceStorage> findByDatasourceId(String datasourceId) {
        return Flux.fromIterable(repository.findByDatasourceId(datasourceId));
    }

    public Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return Mono.justOrEmpty(repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<DatasourceStorage> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Mono<DatasourceStorage> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Flux<DatasourceStorage> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<DatasourceStorage> archive(DatasourceStorage entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public DatasourceStorage updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Flux<DatasourceStorage> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Flux<DatasourceStorage> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public DatasourceStorage setUserPermissionsInObject(DatasourceStorage obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }
}
