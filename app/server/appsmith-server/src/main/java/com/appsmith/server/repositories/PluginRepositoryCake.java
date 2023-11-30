package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
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


import java.util.*;

@Component
@RequiredArgsConstructor
public class PluginRepositoryCake {
    private final PluginRepository repository;

    // From CrudRepository
    public Mono<Plugin> save(Plugin entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }
    public Flux<Plugin> saveAll(Iterable<Plugin> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }
    public Mono<Plugin> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<Plugin> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Flux<Plugin> findByType(PluginType pluginType) {
        return Flux.fromIterable(repository.findByType(pluginType));
    }

    public Flux<Plugin> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Flux<Plugin> findDefaultPluginIcons() {
        return Flux.fromIterable(repository.findDefaultPluginIcons());
    }

    public Mono<Plugin> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Mono<Plugin> archive(Plugin entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<Plugin> findByPackageName(String packageName) {
        return Mono.justOrEmpty(repository.findByPackageName(packageName));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Plugin setUserPermissionsInObject(Plugin obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Plugin setUserPermissionsInObject(Plugin obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Flux<Plugin> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Plugin updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Flux<Plugin> findByDefaultInstall(Boolean isDefaultInstall) {
        return Flux.fromIterable(repository.findByDefaultInstall(isDefaultInstall));
    }

    public Flux<Plugin> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<Plugin> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Flux<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return Flux.fromIterable(repository.findAllByIdsWithoutPermission(ids, includeFields));
    }

    public Mono<Plugin> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Mono<Plugin> findByName(String name) {
        return Mono.justOrEmpty(repository.findByName(name));
    }

}