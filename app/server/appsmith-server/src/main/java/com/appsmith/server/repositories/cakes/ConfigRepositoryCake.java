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

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class ConfigRepositoryCake extends BaseCake<Config, ConfigRepository> {
    private final ConfigRepository repository;

    public ConfigRepositoryCake(ConfigRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<Config> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<Config> saveAll(Iterable<Config> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(ConfigRepositoryCake baseRepository, List<Config> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(ConfigRepositoryCake baseRepository, List<Config> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<Config> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<Config> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<Config> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ConfigRepositoryCE#findByName(String) */
    public Mono<Config> findByName(String name) {
        return asMono(() -> repository.findByName(name));
    }

    /** @see com.appsmith.server.repositories.ce.CustomConfigRepositoryCE#findByName(String, AclPermission, User) */
    public Mono<Config> findByName(String name, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findByName(name, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomConfigRepositoryCE#findByNameAsUser(String, User, AclPermission, User) */
    public Mono<Config> findByNameAsUser(String name, User user, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findByNameAsUser(name, user, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<Config> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<Config> setUserPermissionsInObject(Config obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<Config> setUserPermissionsInObject(Config obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<Config> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<Config> updateById(String id, Config resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
