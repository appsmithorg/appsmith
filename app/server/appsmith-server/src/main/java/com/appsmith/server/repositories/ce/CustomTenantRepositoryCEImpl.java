package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@RequiredArgsConstructor
public class CustomTenantRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Tenant>
        implements CustomTenantRepositoryCE {
    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final ReactiveMongoOperations mongoOperations;

    @Override
    public Mono<Tenant> save(Tenant tenant) {
        Mono<Tenant> savedTenantMono = mongoOperations.save(tenant).cache();
        return savedTenantMono.flatMap(tenant1 -> {
            Mono<Void> evictTenantCache = cacheableRepositoryHelper.evictCachedTenant(tenant1.getId());
            return evictTenantCache.then(savedTenantMono);
        });
    }

    @Override
    public Mono<Tenant> update(String tenantId, Tenant tenant) {
        Mono<Void> evictTenantCache = cacheableRepositoryHelper.evictCachedTenant(tenantId);
        Mono<Tenant> updatedTenantMono = mongoOperations
                .update(Tenant.class)
                .matching(query(where("_id").is(tenantId)))
                .replaceWith(tenant)
                .findAndReplace()
                .cache();
        return updatedTenantMono.then(Mono.defer(() -> evictTenantCache)).then(updatedTenantMono);
    }
}
