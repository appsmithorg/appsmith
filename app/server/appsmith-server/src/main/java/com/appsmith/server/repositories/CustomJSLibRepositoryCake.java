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

    public Flux<CustomJSLib> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Mono<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib) {
        return Mono.justOrEmpty(repository.findUniqueCustomJsLib(customJSLib));
    }

    public CustomJSLib setUserPermissionsInObject(CustomJSLib obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public CustomJSLib setUserPermissionsInObject(CustomJSLib obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Flux<CustomJSLib> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<CustomJSLib> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public CustomJSLib updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Flux<CustomJSLib> findCustomJsLibsInContext(
            Set<String> uidStrings, String referenceId, CreatorContextType contextType) {
        return Flux.fromIterable(repository.findCustomJsLibsInContext(uidStrings, referenceId, contextType));
    }

    public Mono<CustomJSLib> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Flux<CustomJSLib> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<CustomJSLib> archive(CustomJSLib entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
