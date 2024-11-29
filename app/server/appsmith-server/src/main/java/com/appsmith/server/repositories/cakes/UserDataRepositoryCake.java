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
public class UserDataRepositoryCake extends BaseCake<UserData, UserDataRepository> {
    private final UserDataRepository repository;

    public UserDataRepositoryCake(UserDataRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<UserData> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<UserData> saveAll(Iterable<UserData> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(UserDataRepositoryCake baseRepository, List<UserData> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(UserDataRepositoryCake baseRepository, List<UserData> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.CustomUserDataRepositoryCE#fetchMostRecentlyUsedWorkspaceId(String) */
    public Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId) {
        return asMono(() -> repository.fetchMostRecentlyUsedWorkspaceId(userId));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<UserData> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<UserData> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<UserData> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.UserDataRepositoryCE#findByUserId(String) */
    public Mono<UserData> findByUserId(String userId) {
        return asMono(() -> repository.findByUserId(userId));
    }

    /** @see com.appsmith.server.repositories.ce.UserDataRepositoryCE#findByUserIdIn(java.util.Collection<String>) */
    public Flux<UserDataProfilePhotoProjection> findByUserIdIn(java.util.Collection<String> userIds) {
        return asFlux(() -> repository.findByUserIdIn(userIds));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<UserData> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.ce.CustomUserDataRepositoryCE#removeEntitiesFromRecentlyUsedList(String, String) */
    public Mono<Void> removeEntitiesFromRecentlyUsedList(String userId, String workspaceId) {
        return asMono(() -> repository.removeEntitiesFromRecentlyUsedList(userId, workspaceId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomUserDataRepositoryCE#saveReleaseNotesViewedVersion(String, String) */
    public Mono<Integer> saveReleaseNotesViewedVersion(String userId, String version) {
        return Mono.fromSupplier(() -> repository.saveReleaseNotesViewedVersion(userId, version))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<UserData> setUserPermissionsInObject(UserData obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<UserData> setUserPermissionsInObject(UserData obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<UserData> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<UserData> updateById(String id, UserData resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.ce.CustomUserDataRepositoryCE#updateByUserId(String, BaseDomain) */
    public Mono<Integer> updateByUserId(String userId, UserData userData) {
        return Mono.fromSupplier(() -> repository.updateByUserId(userId, userData))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
