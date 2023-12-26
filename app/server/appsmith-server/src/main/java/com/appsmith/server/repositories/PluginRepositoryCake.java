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
public class PluginRepositoryCake extends BaseCake<Plugin> {
    private final PluginRepository repository;

    public PluginRepositoryCake(PluginRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<Plugin> saveAll(Iterable<Plugin> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<Plugin> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Flux<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByIdsWithoutPermission(ids, includeFields)));
    }

    public Flux<Plugin> findByDefaultInstall(Boolean isDefaultInstall) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByDefaultInstall(isDefaultInstall)));
    }

    public Flux<Plugin> findByType(PluginType pluginType) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByType(pluginType)));
    }

    public Flux<Plugin> findDefaultPluginIcons() {
        return Flux.defer(() -> Flux.fromIterable(repository.findDefaultPluginIcons()));
    }

    public Flux<Plugin> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<Plugin> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<Plugin> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Plugin> archive(Plugin entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<Plugin> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Plugin> findByName(String name) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByName(name)));
    }

    public Mono<Plugin> findByPackageName(String packageName) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByPackageName(packageName)));
    }

    public Mono<Plugin> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<Plugin> setUserPermissionsInObject(Plugin obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Plugin> setUserPermissionsInObject(Plugin obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<Plugin> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
