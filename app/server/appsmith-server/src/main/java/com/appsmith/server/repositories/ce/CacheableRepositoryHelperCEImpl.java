package com.appsmith.server.repositories.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Slf4j
public class CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelperCE {
    private final ReactiveMongoOperations mongoOperations;
    private final Map<String, User> tenantAnonymousUserMap;

    private Set<String> anonymousUserPermissionGroupIds;

    private String defaultTenantId;

    public CacheableRepositoryHelperCEImpl(ReactiveMongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
        this.defaultTenantId = null;
        this.tenantAnonymousUserMap = new HashMap<>();
        anonymousUserPermissionGroupIds = null;
    }

    @Cache(cacheName = "permissionGroupsForUser", key = "{#user.email + #user.tenantId}")
    @Override
    public Mono<Set<String>> getPermissionGroupsOfUser(User user) {
        Criteria assignedToUserIdsCriteria = Criteria.where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).is(user.getId());
        Criteria notDeletedCriteria = notDeleted();

        Criteria andCriteria = new Criteria();
        andCriteria.andOperator(assignedToUserIdsCriteria, notDeletedCriteria);

        Query query = new Query();
        query.addCriteria(andCriteria);

        return mongoOperations.find(query, PermissionGroup.class)
                .map(permissionGroup -> permissionGroup.getId())
                .collect(Collectors.toSet());
    }

    @Override
    public Mono<Set<String>> getPermissionGroupsOfAnonymousUser() {

        if (anonymousUserPermissionGroupIds != null) {
            return Mono.just(anonymousUserPermissionGroupIds);
        }

        log.debug("In memory cache miss for anonymous user permission groups. Fetching from DB and adding it to in memory storage.");

        // All public access is via a single permission group. Fetch the same and set the cache with it.
        return mongoOperations.findOne(Query.query(Criteria.where(fieldName(QConfig.config1.name)).is(FieldName.PUBLIC_PERMISSION_GROUP)), Config.class)
                .map(publicPermissionGroupConfig -> Set.of(publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID)))
                .doOnSuccess(permissionGroupIds -> anonymousUserPermissionGroupIds = permissionGroupIds);
    }

    @CacheEvict(cacheName = "permissionGroupsForUser", key = "{#email + #tenantId}")
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
