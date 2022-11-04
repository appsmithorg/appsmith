package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomConfigRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Config> implements CustomConfigRepositoryCE {

    public CustomConfigRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<Config> findByName(String name, AclPermission permission) {
        Criteria nameCriteria = where(fieldName(QConfig.config1.name)).is(name);
        return queryOne(List.of(nameCriteria), permission);
    }

    @Override
    public Mono<Config> findByNameAsUser(String name, User user, AclPermission permission) {

        return getAllPermissionGroupsForUser(user)
                .flatMap(permissionGroups -> {
                    Criteria nameCriteria = where(fieldName(QConfig.config1.name)).is(name);
                    Query query = new Query(nameCriteria);
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .one()
                            .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
                });
    }
}
