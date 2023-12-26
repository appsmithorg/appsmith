package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
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
public class CustomJSLibRepositoryCake extends BaseCake<CustomJSLib> {
    private final CustomJSLibRepository repository;

    public CustomJSLibRepositoryCake(CustomJSLibRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<CustomJSLib> saveAll(Iterable<CustomJSLib> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<CustomJSLib> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<CustomJSLib> setUserPermissionsInObject(CustomJSLib obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<CustomJSLib> setUserPermissionsInObject(CustomJSLib obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<CustomJSLib> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Flux<CustomJSLib> findCustomJsLibsInContext(Set<CustomJSLibContextDTO> customJSLibContextDTOS) {
        return Flux.defer(() -> Flux.fromIterable(repository.findCustomJsLibsInContext(customJSLibContextDTOS)));
    }

    public Flux<CustomJSLib> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<CustomJSLib> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<CustomJSLib> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<CustomJSLib> archive(CustomJSLib entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<CustomJSLib> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findUniqueCustomJsLib(customJSLib)));
    }

    public Mono<CustomJSLib> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
