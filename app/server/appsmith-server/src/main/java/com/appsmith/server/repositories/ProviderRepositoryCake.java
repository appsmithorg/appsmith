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
public class ProviderRepositoryCake {
    private final ProviderRepository repository;

    // From CrudRepository
    public Mono<Provider> save(Provider entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<Provider> saveAll(Iterable<Provider> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<Provider> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Provider setUserPermissionsInObject(Provider obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Mono<UpdateResult> updateByIdAndFieldNames(String id, Map<String, Object> fieldNameValueMap) {
        return Mono.justOrEmpty(repository.updateByIdAndFieldNames(id, fieldNameValueMap));
    }

    public Mono<Provider> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Mono<Provider> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Mono<Provider> archive(Provider entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Flux<Provider> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Flux<Provider> findByName(String name) {
        return Flux.fromIterable(repository.findByName(name));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Flux<Provider> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Provider updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Mono<Provider> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Flux<Provider> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Provider setUserPermissionsInObject(Provider obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<Provider> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }
}
