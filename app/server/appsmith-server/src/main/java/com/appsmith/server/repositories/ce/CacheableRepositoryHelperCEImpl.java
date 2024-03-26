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
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.ANONYMOUS_USER;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_CONFIG;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Slf4j
@Component
public class CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelperCE {
    private final ReactiveMongoOperations mongoOperations;
    private final InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper;
    private final Map<String, User> tenantAnonymousUserMap = new HashMap<>();

    public CacheableRepositoryHelperCEImpl(
            ReactiveMongoOperations mongoOperations,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        this.mongoOperations = mongoOperations;
        this.inMemoryCacheableRepositoryHelper = inMemoryCacheableRepositoryHelper;
    }

    @Cache(cacheName = "permissionGroupsForUser", key = "{#user.email + #user.tenantId}")
    @Override
    public Mono<Set<String>> getPermissionGroupsOfUser(User user) {

        // If the user is anonymous, then we don't need to fetch the permission groups from the database. We can just
        // return the cached permission group ids.
        if (ANONYMOUS_USER.equals(user.getUsername())) {
            return getPermissionGroupsOfAnonymousUser();
        }

        if (user.getEmail() == null
                || user.getEmail().isEmpty()
                || user.getId() == null
                || user.getId().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.SESSION_BAD_STATE));
        }

        Mono<Query> createQueryMono = getInstanceAdminPermissionGroupId().map(instanceAdminPermissionGroupId -> {
            Criteria assignedToUserIdsCriteria = Criteria.where(
                            fieldName(QPermissionGroup.permissionGroup.assignedToUserIds))
                    .is(user.getId());

            Criteria notDeletedCriteria = notDeleted();

            // The roles should be either workspace default roles, user management role, or instance admin role
            Criteria ceSupportedRolesCriteria = new Criteria()
                    .orOperator(
                            Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                                    .is(Workspace.class.getSimpleName()),
                            Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                                    .is(User.class.getSimpleName()),
                            Criteria.where(fieldName(QPermissionGroup.permissionGroup.id))
                                    .is(instanceAdminPermissionGroupId));

            Criteria andCriteria = new Criteria();
            andCriteria.andOperator(assignedToUserIdsCriteria, notDeletedCriteria, ceSupportedRolesCriteria);

            Query query = new Query();
            query.addCriteria(andCriteria);

            // Since we are only interested in the permission group ids, we can project only the id field.
            query.fields().include(fieldName(QPermissionGroup.permissionGroup.id));

            return query;
        });

        return createQueryMono
                .map(query -> mongoOperations.find(query, PermissionGroup.class))
                .flatMapMany(obj -> obj)
                .map(permissionGroup -> permissionGroup.getId())
                .collect(Collectors.toSet());
    }

    @Override
    public Mono<Set<String>> preFillAnonymousUserPermissionGroupIdsCache() {
        Set<String> roleIdsForAnonymousUser = inMemoryCacheableRepositoryHelper.getAnonymousUserPermissionGroupIds();

        if (roleIdsForAnonymousUser != null && !roleIdsForAnonymousUser.isEmpty()) {
            return Mono.just(inMemoryCacheableRepositoryHelper.getAnonymousUserPermissionGroupIds());
        }

        log.debug(
                "In memory cache miss for anonymous user permission groups. Fetching from DB and adding it to in memory storage.");

        // All public access is via a single permission group. Fetch the same and set the cache with it.
        return mongoOperations
                .findOne(
                        Query.query(
                                Criteria.where(fieldName(QConfig.config1.name)).is(FieldName.PUBLIC_PERMISSION_GROUP)),
                        Config.class)
                .map(publicPermissionGroupConfig ->
                        Set.of(publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID)))
                .doOnSuccess(inMemoryCacheableRepositoryHelper::setAnonymousUserPermissionGroupIds);
    }

    @Override
    public Mono<Set<String>> getPermissionGroupsOfAnonymousUser() {
        Set<String> roleIdsForAnonymousUser = inMemoryCacheableRepositoryHelper.getAnonymousUserPermissionGroupIds();

        if (roleIdsForAnonymousUser != null) {
            return Mono.just(roleIdsForAnonymousUser);
        }

        // If we have reached this state, then the cache is not populated. We need to wait for this to get populated
        // Anonymous user cache is getting populated at #InstanceConfig.onApplicationEvent
        // Return an error to the user so that the user can re-try in some time
        return Mono.error(new AppsmithException(AppsmithError.SERVER_NOT_READY));
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

        Criteria anonymousUserCriteria =
                Criteria.where(fieldName(QUser.user.email)).is(FieldName.ANONYMOUS_USER);
        Criteria tenantIdCriteria =
                Criteria.where(fieldName(QUser.user.tenantId)).is(tenantId);

        Query query = new Query();
        query.addCriteria(anonymousUserCriteria);
        query.addCriteria(tenantIdCriteria);

        return mongoOperations.findOne(query, User.class).map(anonymousUser -> {
            tenantAnonymousUserMap.put(tenantId, anonymousUser);
            return anonymousUser;
        });
    }

    @Override
    public Mono<User> getAnonymousUser() {
        String defaultTenantId = inMemoryCacheableRepositoryHelper.getDefaultTenantId();
        if (defaultTenantId != null && !defaultTenantId.isEmpty()) {
            return getAnonymousUser(defaultTenantId);
        }

        Criteria defaultTenantCriteria =
                Criteria.where(fieldName(QTenant.tenant.slug)).is(FieldName.DEFAULT);
        Query query = new Query();
        query.addCriteria(defaultTenantCriteria);

        return mongoOperations.findOne(query, Tenant.class).flatMap(defaultTenant -> {
            inMemoryCacheableRepositoryHelper.setDefaultTenantId(defaultTenant.getId());
            return getAnonymousUser(defaultTenant.getId());
        });
    }

    @Override
    public Mono<String> getDefaultTenantId() {
        String defaultTenantId = inMemoryCacheableRepositoryHelper.getDefaultTenantId();
        if (defaultTenantId != null && !defaultTenantId.isEmpty()) {
            return Mono.just(defaultTenantId);
        }

        Criteria defaultTenantCriteria =
                Criteria.where(fieldName(QTenant.tenant.slug)).is(FieldName.DEFAULT);
        Query query = new Query();
        query.addCriteria(defaultTenantCriteria);

        return mongoOperations.findOne(query, Tenant.class).map(defaultTenant -> {
            String newDefaultTenantId = defaultTenant.getId();
            inMemoryCacheableRepositoryHelper.setDefaultTenantId(newDefaultTenantId);
            return newDefaultTenantId;
        });
    }

    @Override
    public Mono<String> getInstanceAdminPermissionGroupId() {
        String instanceAdminPermissionGroupId = inMemoryCacheableRepositoryHelper.getInstanceAdminPermissionGroupId();
        if (instanceAdminPermissionGroupId != null && !instanceAdminPermissionGroupId.isEmpty()) {
            return Mono.just(instanceAdminPermissionGroupId);
        }

        Criteria configName = Criteria.where(fieldName(QConfig.config1.name)).is(INSTANCE_CONFIG);

        return mongoOperations
                .findOne(new Query().addCriteria(configName), Config.class)
                .map(instanceConfig -> {
                    JSONObject config = instanceConfig.getConfig();
                    return (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
                })
                .doOnSuccess(permissionGroupId ->
                        inMemoryCacheableRepositoryHelper.setInstanceAdminPermissionGroupId(permissionGroupId));
    }
}
