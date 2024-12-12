package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public class CustomDatasourceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Datasource>
        implements CustomDatasourceRepositoryCE {

    @Override
    public Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission) {
        Sort sort = Sort.by(Datasource.Fields.name);
        return queryBuilder()
                .criteria(Bridge.equal(Datasource.Fields.workspaceId, workspaceId))
                .permission(permission)
                .sort(sort)
                .all();
    }

    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.equal(Datasource.Fields.name, name).equal(Datasource.Fields.workspaceId, workspaceId))
                .permission(aclPermission)
                .one();
    }

    @Override
    public Flux<Datasource> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        final BridgeQuery<Datasource> q = Bridge.equal(Datasource.Fields.workspaceId, workspaceId);
        return queryBuilder().criteria(q).permission(aclPermission).all();
    }

    @Override
    public Flux<Datasource> findAllByWorkspaceIdWithoutPermissions(String workspaceId) {
        final BridgeQuery<Datasource> q = Bridge.equal(Datasource.Fields.workspaceId, workspaceId);
        return queryBuilder().criteria(q).all();
    }

    @Override
    public Flux<Datasource> findByIdIn(List<String> ids) {
        final BridgeQuery<Datasource> q = Bridge.in(Datasource.Fields.id, ids);
        return queryBuilder().criteria(q).all();
    }

    @Override
    public Mono<Long> countByDeletedAtNull() {
        final BridgeQuery<Datasource> q = Bridge.isNull(Datasource.Fields.deletedAt);
        return queryBuilder().criteria(q).count();
    }
}
