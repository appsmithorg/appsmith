package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomConfigRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Config>
        implements CustomConfigRepositoryCE {

    public CustomConfigRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<Config> findByName(String name, AclPermission permission) {
        Criteria nameCriteria = where(Config.Fields.name).is(name);
        return queryBuilder().criteria(nameCriteria).permission(permission).one();
    }

    @Override
    public Mono<Config> findByNameAsUser(String name, User user, AclPermission permission) {
        return getAllPermissionGroupsForUser(user).flatMap(permissionGroups -> queryBuilder()
                .criteria(Bridge.equal(Config.Fields.name, name))
                .permission(permission)
                .permissionGroups(permissionGroups)
                .one());
    }
}
