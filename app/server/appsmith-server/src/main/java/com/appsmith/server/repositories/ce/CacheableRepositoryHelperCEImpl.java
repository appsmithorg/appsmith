package com.appsmith.server.repositories.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;

public class CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelperCE {
    private final ReactiveMongoOperations mongoOperations;
    private final Map<String, User> tenantAnonymousUserMap;

    private String defaultTenantId;

    public CacheableRepositoryHelperCEImpl(ReactiveMongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
        this.defaultTenantId = null;
        this.tenantAnonymousUserMap = new HashMap<>();
    }

    @Cache(cacheName = "permissionGroupsForUser", key="{#user.email + #user.tenantId}")
    @Override
    public Mono<Set<String>> getPermissionGroupsOfUser(User user) {
        Criteria assignedToUserIdsCriteria = Criteria.where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).is(user.getId());

        Query query = new Query();
        query.addCriteria(assignedToUserIdsCriteria);

        return mongoOperations.find(query, PermissionGroup.class)
                .map(permissionGroup -> permissionGroup.getId())
                .collect(Collectors.toSet());
    }

    @CacheEvict(cacheName = "permissionGroupsForUser", key="{#email + #tenantId}")
    @Override
    public Mono<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return Mono.empty();
    }

    @Override
    public Mono<User> getAnonymousUser(String tenantId) {
        if (tenantAnonymousUserMap.containsKey(tenantId)) {
            return Mono.just(tenantAnonymousUserMap.get(tenantId));
        }

        Criteria anonymousUserCriteria = Criteria.where(fieldName(QUser.user.email)).is(FieldName.ANONYMOUS_USER);
        Criteria tenantIdCriteria = Criteria.where(fieldName(QUser.user.tenantId)).is(tenantId);

        Query query = new Query();
        query.addCriteria(anonymousUserCriteria);
        query.addCriteria(tenantIdCriteria);

        return mongoOperations.findOne(query, User.class)
                .map(anonymousUser -> {
                    tenantAnonymousUserMap.put(tenantId, anonymousUser);
                    return anonymousUser;
                });
    }

    @Override
    public Mono<User> getAnonymousUser() {
        if (defaultTenantId != null && !defaultTenantId.isEmpty()) {
            return getAnonymousUser(defaultTenantId);
        }

        Criteria defaultTenantCriteria = Criteria.where(fieldName(QTenant.tenant.slug)).is(FieldName.DEFAULT);
        Query query = new Query();
        query.addCriteria(defaultTenantCriteria);

        return mongoOperations.findOne(query, Tenant.class)
                .flatMap(defaultTenant -> {
                    defaultTenantId = defaultTenant.getId();
                    return getAnonymousUser(defaultTenant.getId());
                });
    }

    @Override
    public Mono<String> getDefaultTenantId() {
        if (defaultTenantId != null && !defaultTenantId.isEmpty()) {
            return Mono.just(defaultTenantId);
        }

        Criteria defaultTenantCriteria = Criteria.where(fieldName(QTenant.tenant.slug)).is(FieldName.DEFAULT);
        Query query = new Query();
        query.addCriteria(defaultTenantCriteria);

        return mongoOperations.findOne(query, Tenant.class)
                .map(defaultTenant -> {
                    defaultTenantId = defaultTenant.getId();
                    return defaultTenantId;
                });
    }
}
