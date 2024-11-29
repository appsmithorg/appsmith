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
public class DatasourceRepositoryCake extends BaseCake<Datasource, DatasourceRepository> {
    private final DatasourceRepository repository;

    public DatasourceRepositoryCake(DatasourceRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<Datasource> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<Datasource> saveAll(Iterable<Datasource> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(DatasourceRepositoryCake baseRepository, List<Datasource> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(DatasourceRepositoryCake baseRepository, List<Datasource> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.DatasourceRepositoryCE#countByDeletedAtNull() */
    public Mono<Long> countByDeletedAtNull() {
        return asMono(() -> repository.countByDeletedAtNull());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<Datasource> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.DatasourceRepositoryCE#findAllByWorkspaceId(String) */
    public Flux<Datasource> findAllByWorkspaceId(String workspaceId) {
        return asFlux(() -> repository.findAllByWorkspaceId(workspaceId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomDatasourceRepositoryCE#findAllByWorkspaceId(String, AclPermission, User) */
    public Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findAllByWorkspaceId(workspaceId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<Datasource> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<Datasource> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.DatasourceRepositoryCE#findByIdIn(List<String>) */
    public Flux<Datasource> findByIdIn(List<String> ids) {
        return asFlux(() -> repository.findByIdIn(ids));
    }

    /** @see com.appsmith.server.repositories.ce.CustomDatasourceRepositoryCE#findByNameAndWorkspaceId(String, String, AclPermission, User) */
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser ->
                        asMono(() -> repository.findByNameAndWorkspaceId(name, workspaceId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.DatasourceRepositoryCE#findIdsAndPolicyMapByIdIn(Set<String>) */
    public Flux<IdPoliciesOnly> findIdsAndPolicyMapByIdIn(Set<String> datasourceIds) {
        return asFlux(() -> repository.findIdsAndPolicyMapByIdIn(datasourceIds));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<Datasource> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<Datasource> setUserPermissionsInObject(Datasource obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<Datasource> setUserPermissionsInObject(Datasource obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<Datasource> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<Datasource> updateById(String id, Datasource resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
