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
public class ApplicationSnapshotRepositoryCake extends BaseCake<ApplicationSnapshot, ApplicationSnapshotRepository> {
    private final ApplicationSnapshotRepository repository;

    public ApplicationSnapshotRepositoryCake(ApplicationSnapshotRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<ApplicationSnapshot> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<ApplicationSnapshot> saveAll(Iterable<ApplicationSnapshot> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(
            ApplicationSnapshotRepositoryCake baseRepository, List<ApplicationSnapshot> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(
            ApplicationSnapshotRepositoryCake baseRepository, List<ApplicationSnapshot> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationSnapshotRepositoryCE#deleteAllByApplicationId(String) */
    public Mono<Void> deleteAllByApplicationId(String applicationId) {
        return asMono(() -> repository.deleteAllByApplicationId(applicationId));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<ApplicationSnapshot> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationSnapshotRepositoryCE#findByApplicationId(String) */
    public Flux<ApplicationSnapshot> findByApplicationId(String applicationId) {
        return asFlux(() -> repository.findByApplicationId(applicationId));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationSnapshotRepositoryCE#findByApplicationIdAndChunkOrder(String, Integer) */
    public Mono<ApplicationSnapshotResponseDTO> findByApplicationIdAndChunkOrder(
            String applicationId, Integer chunkOrder) {
        return asMono(() -> repository.findByApplicationIdAndChunkOrder(applicationId, chunkOrder));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<ApplicationSnapshot> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<ApplicationSnapshot> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<ApplicationSnapshot> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<ApplicationSnapshot> setUserPermissionsInObject(ApplicationSnapshot obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<ApplicationSnapshot> setUserPermissionsInObject(
            ApplicationSnapshot obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<ApplicationSnapshot> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<ApplicationSnapshot> updateById(String id, ApplicationSnapshot resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
