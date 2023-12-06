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
public class PageRepositoryCake {
    private final PageRepository repository;

    // From CrudRepository
    public Mono<Page> save(Page entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<Page> saveAll(Iterable<Page> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<Page> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<Page> findByIdAndLayoutsId(String id, String layoutId, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByIdAndLayoutsId(id, layoutId, aclPermission));
    }

    public Page setUserPermissionsInObject(Page obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Mono<Page> findByNameAndApplicationId(String name, String applicationId, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByNameAndApplicationId(name, applicationId, aclPermission));
    }

    public Flux<Page> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Mono<Page> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Flux<Page> findByApplicationId(String applicationId) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Flux<Page> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Page updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Flux<Page> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Page setUserPermissionsInObject(Page obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<Page> archive(Page entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Flux<Page> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission));
    }

    public Mono<Page> findByName(String name, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByName(name, aclPermission));
    }

    public Mono<Page> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }
}
