package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class ApplicationSnapshotRepositoryCake {
    private final ApplicationSnapshotRepository repository;

    // From CrudRepository
    public Mono<ApplicationSnapshot> save(ApplicationSnapshot entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<ApplicationSnapshot> saveAll(Iterable<ApplicationSnapshot> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<ApplicationSnapshot> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<ApplicationSnapshot> archive(ApplicationSnapshot entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<Void> deleteAllByApplicationId(String applicationId) {
        return Mono.justOrEmpty(repository.deleteAllByApplicationId(applicationId));
    }

    public Mono<UpdateResult> updateByIdAndFieldNames(String id, Map<String, Object> fieldNameValueMap) {
        return Mono.justOrEmpty(repository.updateByIdAndFieldNames(id, fieldNameValueMap));
    }

    public Mono<ApplicationSnapshot> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public ApplicationSnapshot setUserPermissionsInObject(ApplicationSnapshot obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Flux<ApplicationSnapshot> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<ApplicationSnapshot> findWithoutData(String applicationId) {
        return Mono.justOrEmpty(repository.findWithoutData(applicationId));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public ApplicationSnapshot setUserPermissionsInObject(ApplicationSnapshot obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public ApplicationSnapshot updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Mono<ApplicationSnapshot> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Flux<ApplicationSnapshot> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Flux<ApplicationSnapshot> findByApplicationId(String applicationId) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId));
    }

    public Mono<ApplicationSnapshot> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Flux<ApplicationSnapshot> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Mono<ApplicationSnapshot> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }
}
