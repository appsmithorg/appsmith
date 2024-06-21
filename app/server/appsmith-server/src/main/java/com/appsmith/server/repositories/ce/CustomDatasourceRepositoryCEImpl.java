package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

public class CustomDatasourceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Datasource>
        implements CustomDatasourceRepositoryCE {

    @Override
    public List<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission, User currentUser) {
        Sort sort = Sort.by(Datasource.Fields.name);
        return queryBuilder()
                .criteria(Bridge.equal(Datasource.Fields.workspaceId, workspaceId))
                .permission(permission)
                .user(currentUser)
                .sort(sort)
                .all();
    }

    @Override
    public Optional<Datasource> findByNameAndWorkspaceId(
            String name, String workspaceId, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge.equal(Datasource.Fields.name, name).equal(Datasource.Fields.workspaceId, workspaceId))
                .permission(permission)
                .user(currentUser)
                .one();
    }
}
