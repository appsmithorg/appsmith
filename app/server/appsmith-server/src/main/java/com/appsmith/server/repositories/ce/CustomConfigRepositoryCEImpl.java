package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;

import java.util.Optional;
import java.util.Set;

public class CustomConfigRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Config>
        implements CustomConfigRepositoryCE {

    @Override
    public Optional<Config> findByName(String name, AclPermission permission, User currentUser) {
        BridgeQuery<Config> nameCriteria = Bridge.equal(Config.Fields.name, name);
        return queryBuilder()
                .criteria(nameCriteria)
                .permission(permission)
                .user(currentUser)
                .one();
    }

    @Override
    public Optional<Config> findByNameAsUser(String name, User user, AclPermission permission, User currentUser) {
        final Set<String> permissionGroups = getAllPermissionGroupsForUser(user);
        return queryBuilder()
                .criteria(Bridge.equal(Config.Fields.name, name))
                .permission(permission)
                .user(currentUser)
                .permissionGroups(permissionGroups)
                .one();
    }
}
