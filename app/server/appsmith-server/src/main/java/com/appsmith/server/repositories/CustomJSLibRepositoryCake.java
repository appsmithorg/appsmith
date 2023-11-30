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
public class CustomJSLibRepositoryCake {
    private final CustomJSLibRepository repository;

    // From CrudRepository
    public Mono<CustomJSLib> save(CustomJSLib entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<CustomJSLib> saveAll(Iterable<CustomJSLib> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<CustomJSLib> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<CustomJSLib> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Mono<CustomJSLib> findByUidString(String uidString) {
        return Mono.justOrEmpty(repository.findByUidString(uidString));
    }

    public Mono<UpdateResult> updateByIdAndFieldNames(String id, Map<String, Object> fieldNameValueMap) {
        return Mono.justOrEmpty(repository.updateByIdAndFieldNames(id, fieldNameValueMap));
    }

    public CustomJSLib setUserPermissionsInObject(CustomJSLib obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Flux<CustomJSLib> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public CustomJSLib updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Mono<CustomJSLib> archive(CustomJSLib entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Flux<CustomJSLib> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<CustomJSLib> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public CustomJSLib setUserPermissionsInObject(CustomJSLib obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Mono<CustomJSLib> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Flux<CustomJSLib> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<CustomJSLib> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }
}
