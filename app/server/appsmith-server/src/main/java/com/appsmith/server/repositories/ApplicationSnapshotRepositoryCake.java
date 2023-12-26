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
public class ApplicationSnapshotRepositoryCake extends BaseCake<ApplicationSnapshot> {
    private final ApplicationSnapshotRepository repository;

    public ApplicationSnapshotRepositoryCake(ApplicationSnapshotRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<ApplicationSnapshot> saveAll(Iterable<ApplicationSnapshot> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<ApplicationSnapshot> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<ApplicationSnapshot> setUserPermissionsInObject(ApplicationSnapshot obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<ApplicationSnapshot> setUserPermissionsInObject(ApplicationSnapshot obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<ApplicationSnapshot> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Flux<ApplicationSnapshot> findByApplicationId(String applicationId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId)));
    }

    public Flux<ApplicationSnapshot> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<ApplicationSnapshot> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<ApplicationSnapshot> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<ApplicationSnapshot> archive(ApplicationSnapshot entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<ApplicationSnapshot> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<ApplicationSnapshot> findWithoutData(String applicationId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findWithoutData(applicationId)));
    }

    public Mono<ApplicationSnapshot> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Void> deleteAllByApplicationId(String applicationId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.deleteAllByApplicationId(applicationId)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
