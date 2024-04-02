package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import reactor.core.publisher.Mono;
import com.appsmith.server.repositories.CacheableRepositoryHelper;

import java.util.Optional;
import java.util.Set;

public class CustomConfigRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Config>
        implements CustomConfigRepositoryCE {

    @Override
    public Optional<Config> findByName(String name, AclPermission permission) {
        BridgeQuery<Config> nameCriteria = Bridge.equal(Config.Fields.name, name);
        return queryBuilder().criteria(nameCriteria).permission(permission).one();
    }

    @Override
    public Optional<Config> findByNameAsUser(String name, User user, AclPermission permission) {
        final Set<String> permissionGroups = getAllPermissionGroupsForUser(user);
        return queryBuilder()
                .criteria(Bridge.equal(Config.Fields.name, name))
                .permission(permission)
                .permissionGroups(permissionGroups)
                .one();
    }
}
