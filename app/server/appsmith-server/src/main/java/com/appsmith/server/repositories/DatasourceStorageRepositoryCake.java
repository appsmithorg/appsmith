package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.cakes.BaseCake;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
public class DatasourceStorageRepositoryCake extends BaseCake<DatasourceStorage> {
    private final DatasourceStorageRepository repository;

    public DatasourceStorageRepositoryCake(DatasourceStorageRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<DatasourceStorage> saveAll(Iterable<DatasourceStorage> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<DatasourceStorage> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<DatasourceStorage> setUserPermissionsInObject(DatasourceStorage obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<DatasourceStorage> setUserPermissionsInObject(DatasourceStorage obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<DatasourceStorage> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Flux<DatasourceStorage> findByDatasourceId(String datasourceId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByDatasourceId(datasourceId)));
    }

    public Flux<DatasourceStorage> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<DatasourceStorage> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<DatasourceStorage> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<DatasourceStorage> archive(DatasourceStorage entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return Mono.defer(
                () -> Mono.justOrEmpty(repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId)));
    }

    public Mono<DatasourceStorage> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<DatasourceStorage> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
