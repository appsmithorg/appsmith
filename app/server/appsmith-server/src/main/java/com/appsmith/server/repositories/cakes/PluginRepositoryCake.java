package com.appsmith.server.repositories.cakes;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.newactions.projections.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.*;
import com.appsmith.server.repositories.ce.params.QueryAllParams;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class PluginRepositoryCake extends BaseCake<Plugin, PluginRepository> {
    private final PluginRepository repository;

    public PluginRepositoryCake(PluginRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<Plugin> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<Plugin> saveAll(Iterable<Plugin> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(PluginRepositoryCake baseRepository, List<Plugin> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(PluginRepositoryCake baseRepository, List<Plugin> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<Plugin> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.CustomPluginRepositoryCE#findAllByIdsWithoutPermission(Set<String>, List<String>) */
    public Flux<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return asFlux(() -> repository.findAllByIdsWithoutPermission(ids, includeFields));
    }

    /** @see com.appsmith.server.repositories.ce.PluginRepositoryCE#findByDefaultInstall(Boolean) */
    public Flux<Plugin> findByDefaultInstall(Boolean isDefaultInstall) {
        return asFlux(() -> repository.findByDefaultInstall(isDefaultInstall));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<Plugin> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<Plugin> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.PluginRepositoryCE#findByName(String) */
    public Mono<Plugin> findByName(String name) {
        return asMono(() -> repository.findByName(name));
    }

    /** @see com.appsmith.server.repositories.ce.PluginRepositoryCE#findByNameIn(Iterable<String>) */
    public Flux<Plugin> findByNameIn(Iterable<String> names) {
        return asFlux(() -> repository.findByNameIn(names));
    }

    /** @see com.appsmith.server.repositories.ce.PluginRepositoryCE#findByPackageName(String) */
    public Mono<Plugin> findByPackageName(String packageName) {
        return asMono(() -> repository.findByPackageName(packageName));
    }

    /** @see com.appsmith.server.repositories.ce.PluginRepositoryCE#findByType(PluginType) */
    public Flux<Plugin> findByType(PluginType pluginType) {
        return asFlux(() -> repository.findByType(pluginType));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPluginRepositoryCE#findDefaultPluginIcons() */
    public Flux<Plugin> findDefaultPluginIcons() {
        return asFlux(() -> repository.findDefaultPluginIcons());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<Plugin> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<Plugin> setUserPermissionsInObject(Plugin obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<Plugin> setUserPermissionsInObject(Plugin obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<Plugin> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<Plugin> updateById(String id, Plugin resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
