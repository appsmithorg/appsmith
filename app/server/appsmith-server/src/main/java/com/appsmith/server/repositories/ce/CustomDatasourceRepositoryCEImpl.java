package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
}
