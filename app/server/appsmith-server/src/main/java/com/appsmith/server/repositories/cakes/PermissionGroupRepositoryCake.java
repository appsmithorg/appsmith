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
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class PermissionGroupRepositoryCake extends BaseCake<PermissionGroup, PermissionGroupRepository> {
    private final PermissionGroupRepository repository;

    public PermissionGroupRepositoryCake(PermissionGroupRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<PermissionGroup> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<PermissionGroup> saveAll(Iterable<PermissionGroup> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(PermissionGroupRepositoryCake baseRepository, List<PermissionGroup> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(PermissionGroupRepositoryCake baseRepository, List<PermissionGroup> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#evictAllPermissionGroupCachesForUser(String, String) */
    public Mono<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return asMono(() -> repository.evictAllPermissionGroupCachesForUser(email, tenantId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#evictPermissionGroupsUser(String, String) */
    public Mono<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return asMono(() -> repository.evictPermissionGroupsUser(email, tenantId));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<PermissionGroup> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#findAllByAssignedToUserIdAndDefaultWorkspaceId(String, String, AclPermission, User) */
    public Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findAllByAssignedToUserIdAndDefaultWorkspaceId(
                        userId, workspaceId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#findAllByAssignedToUserIn(Set<String>, Optional<List<String>>, Optional<AclPermission>, User) */
    public Flux<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(
                        () -> repository.findAllByAssignedToUserIn(userIds, includeFields, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.PermissionGroupRepositoryCE#findAllByIdIn(Set<String>) */
    public Flux<PermissionGroup> findAllByIdIn(Set<String> ids) {
        return asFlux(() -> repository.findAllByIdIn(ids));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#findByAssignedToUserIdsIn(String) */
    public Flux<PermissionGroup> findByAssignedToUserIdsIn(String userId) {
        return asFlux(() -> repository.findByAssignedToUserIdsIn(userId));
    }

    /** @see com.appsmith.server.repositories.ce.PermissionGroupRepositoryCE#findByDefaultDomainIdAndDefaultDomainType(String, String) */
    public Flux<PermissionGroup> findByDefaultDomainIdAndDefaultDomainType(String defaultDomainId, String domainType) {
        return asFlux(() -> repository.findByDefaultDomainIdAndDefaultDomainType(defaultDomainId, domainType));
    }

    /** @see com.appsmith.server.repositories.ce.PermissionGroupRepositoryCE#findByDefaultWorkspaceId(String) */
    public Flux<PermissionGroup> findByDefaultWorkspaceId(String defaultWorkspaceId) {
        return asFlux(() -> repository.findByDefaultWorkspaceId(defaultWorkspaceId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#findByDefaultWorkspaceId(String, AclPermission, User) */
    public Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByDefaultWorkspaceId(workspaceId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#findByDefaultWorkspaceIds(Set<String>, AclPermission, User) */
    public Flux<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByDefaultWorkspaceIds(workspaceIds, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<PermissionGroup> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<PermissionGroup> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#getAllPermissionGroupsIdsForUser(User) */
    public Mono<Set<String>> getAllPermissionGroupsIdsForUser(User user) {
        return Mono.fromSupplier(() -> repository.getAllPermissionGroupsIdsForUser(user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<PermissionGroup> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#getPermissionGroupsForUser(User) */
    public Mono<Set<String>> getPermissionGroupsForUser(User user) {
        return Mono.fromSupplier(() -> repository.getPermissionGroupsForUser(user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<PermissionGroup> setUserPermissionsInObject(PermissionGroup obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<PermissionGroup> setUserPermissionsInObject(
            PermissionGroup obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<PermissionGroup> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE#updateById(String, BridgeUpdate) */
    public Mono<Integer> updateById(String id, BridgeUpdate updateObj) {
        return Mono.fromSupplier(() -> repository.updateById(id, updateObj)).subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<PermissionGroup> updateById(String id, PermissionGroup resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
