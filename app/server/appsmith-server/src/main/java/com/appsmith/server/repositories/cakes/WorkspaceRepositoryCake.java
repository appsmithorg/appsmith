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
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class WorkspaceRepositoryCake extends BaseCake<Workspace, WorkspaceRepository> {
    private final WorkspaceRepository repository;

    public WorkspaceRepositoryCake(WorkspaceRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<Workspace> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<Workspace> saveAll(Iterable<Workspace> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(WorkspaceRepositoryCake baseRepository, List<Workspace> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(WorkspaceRepositoryCake baseRepository, List<Workspace> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.WorkspaceRepositoryCE#countByDeletedAtNull() */
    public Mono<Long> countByDeletedAtNull() {
        return asMono(() -> repository.countByDeletedAtNull());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<Workspace> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.CustomWorkspaceRepositoryCE#findAll(AclPermission, User) */
    public Flux<Workspace> findAll(AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findAll(permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<Workspace> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<Workspace> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.WorkspaceRepositoryCE#findByIdAndPluginsPluginId(String, String) */
    public Mono<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId) {
        return asMono(() -> repository.findByIdAndPluginsPluginId(workspaceId, pluginId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomWorkspaceRepositoryCE#findByIdsIn(Set<String>, String, AclPermission, User, Sort) */
    public Flux<Workspace> findByIdsIn(Set<String> workspaceIds, String tenantId, AclPermission permission, Sort sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByIdsIn(workspaceIds, tenantId, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.WorkspaceRepositoryCE#findByName(String) */
    public Mono<Workspace> findByName(String name) {
        return asMono(() -> repository.findByName(name));
    }

    /** @see com.appsmith.server.repositories.ce.CustomWorkspaceRepositoryCE#findByName(String, AclPermission, User) */
    public Mono<Workspace> findByName(String name, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findByName(name, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<Workspace> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<Workspace> setUserPermissionsInObject(Workspace obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<Workspace> setUserPermissionsInObject(Workspace obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<Workspace> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<Workspace> updateById(String id, Workspace resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
