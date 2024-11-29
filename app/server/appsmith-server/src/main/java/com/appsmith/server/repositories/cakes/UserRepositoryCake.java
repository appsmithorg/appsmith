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

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class UserRepositoryCake extends BaseCake<User, UserRepository> {
    private final UserRepository repository;

    public UserRepositoryCake(UserRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<User> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<User> saveAll(Iterable<User> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(UserRepositoryCake baseRepository, List<User> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(UserRepositoryCake baseRepository, List<User> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.UserRepositoryCE#countByDeletedAtIsNullAndIsSystemGeneratedIsNot(Boolean) */
    public Mono<Long> countByDeletedAtIsNullAndIsSystemGeneratedIsNot(Boolean excludeSystemGenerated) {
        return asMono(() -> repository.countByDeletedAtIsNullAndIsSystemGeneratedIsNot(excludeSystemGenerated));
    }

    /** @see com.appsmith.server.repositories.ce.UserRepositoryCE#countByDeletedAtIsNullAndLastActiveAtGreaterThanAndIsSystemGeneratedIsNot(Instant, Boolean) */
    public Mono<Long> countByDeletedAtIsNullAndLastActiveAtGreaterThanAndIsSystemGeneratedIsNot(
            Instant lastActiveAt, Boolean excludeSystemGenerated) {
        return asMono(() -> repository.countByDeletedAtIsNullAndLastActiveAtGreaterThanAndIsSystemGeneratedIsNot(
                lastActiveAt, excludeSystemGenerated));
    }

    /** @see com.appsmith.server.repositories.ce.UserRepositoryCE#countByDeletedAtNull() */
    public Mono<Long> countByDeletedAtNull() {
        return asMono(() -> repository.countByDeletedAtNull());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<User> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.UserRepositoryCE#findAllByEmailIn(Set<String>) */
    public Flux<User> findAllByEmailIn(Set<String> emails) {
        return asFlux(() -> repository.findAllByEmailIn(emails));
    }

    /** @see com.appsmith.server.repositories.ce.UserRepositoryCE#findByEmail(String) */
    public Mono<User> findByEmail(String email) {
        return asMono(() -> repository.findByEmail(email));
    }

    /** @see com.appsmith.server.repositories.ce.CustomUserRepositoryCE#findByEmail(String, AclPermission, BaseDomain) */
    public Mono<User> findByEmail(String email, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findByEmail(email, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.UserRepositoryCE#findByEmailAndTenantId(String, String) */
    public Mono<User> findByEmailAndTenantId(String email, String tenantId) {
        return asMono(() -> repository.findByEmailAndTenantId(email, tenantId));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<User> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, BaseDomain) */
    public Mono<User> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.UserRepositoryCE#findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(String) */
    public Mono<User> findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(String email) {
        return asMono(() -> repository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(email));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<User> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.ce.CustomUserRepositoryCE#isUsersEmpty() */
    public Mono<Boolean> isUsersEmpty() {
        return asMono(() -> repository.isUsersEmpty());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, BaseDomain) */
    public Mono<User> setUserPermissionsInObject(User obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<User> setUserPermissionsInObject(User obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, BaseDomain) */
    public Mono<User> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, BaseDomain) */
    public Mono<User> updateById(String id, User resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
