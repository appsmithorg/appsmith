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
public class DatasourceStorageRepositoryCake extends BaseCake<DatasourceStorage, DatasourceStorageRepository> {
    private final DatasourceStorageRepository repository;

    public DatasourceStorageRepositoryCake(DatasourceStorageRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<DatasourceStorage> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<DatasourceStorage> saveAll(Iterable<DatasourceStorage> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(DatasourceStorageRepositoryCake baseRepository, List<DatasourceStorage> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(DatasourceStorageRepositoryCake baseRepository, List<DatasourceStorage> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<DatasourceStorage> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.DatasourceStorageRepositoryCE#findByDatasourceId(String) */
    public Flux<DatasourceStorage> findByDatasourceId(String datasourceId) {
        return asFlux(() -> repository.findByDatasourceId(datasourceId));
    }

    /** @see com.appsmith.server.repositories.ce.DatasourceStorageRepositoryCE#findByDatasourceIdAndEnvironmentId(String, String) */
    public Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return asMono(() -> repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<DatasourceStorage> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<DatasourceStorage> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<DatasourceStorage> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<DatasourceStorage> setUserPermissionsInObject(DatasourceStorage obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<DatasourceStorage> setUserPermissionsInObject(
            DatasourceStorage obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<DatasourceStorage> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<DatasourceStorage> updateById(String id, DatasourceStorage resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
