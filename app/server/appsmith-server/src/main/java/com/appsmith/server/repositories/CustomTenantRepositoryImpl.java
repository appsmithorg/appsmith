package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.ce.CustomTenantRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;

import java.util.List;

public class CustomTenantRepositoryImpl extends CustomTenantRepositoryCEImpl implements CustomTenantRepository {

    public CustomTenantRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<Tenant> findBySlug(String slug, AclPermission aclPermission) {
        Criteria slugCriteria = Criteria.where(fieldName(QTenant.tenant.slug)).is(slug);

        return queryOne(List.of(slugCriteria), aclPermission);
    }
}
