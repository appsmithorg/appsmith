package com.appsmith.server.repositories.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelperCE {
    private final ReactiveMongoOperations mongoOperations;
    private final EntityManager entityManager;
    private final InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper;
    private final Map<String, User> tenantAnonymousUserMap = new HashMap<>();

    @Cache(cacheName = "permissionGroupsForUser", key = "{#user.email + #user.tenantId}")
    @Override
    public Mono<Set<String>> getPermissionGroupsOfUser(User user) {

        // If the user is anonymous, then we don't need to fetch the permission groups from the database. We can just
        // return the cached permission group ids.
        if (ANONYMOUS_USER.equals(user.getUsername())) {
            return getPermissionGroupsOfAnonymousUser();
        }

        if (user.getEmail() == null || user.getEmail().isEmpty() || user.getId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.SESSION_BAD_STATE));
        }

        return getInstanceAdminPermissionGroupId().map(instanceAdminPermissionGroupId -> {
            final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
            final CriteriaQuery<PermissionGroup> cq = cb.createQuery(PermissionGroup.class);
            final Root<PermissionGroup> root = cq.from(PermissionGroup.class);

            Predicate predicate;

            predicate = cb.and(
                    cb.isNull(root.get(PermissionGroup.Fields.deletedAt)),
                    cb.isTrue(cb.function(
                            "jsonb_path_exists",
                            Boolean.class,
                            root.get(PermissionGroup.Fields.assignedToUserIds),
                            cb.literal("$[*] ? (@ == \"" + user.getId() + "\")"))),
                    cb.or(
                            cb.equal(
                                    root.get(PermissionGroup.Fields.defaultDomainType),
                                    Workspace.class.getSimpleName()),
                            cb.equal(
                                    root.get(PermissionGroup.Fields.defaultDomainType),
                                    User.class.getSimpleName()),
                            cb.equal(
                                    root.get(PermissionGroup.Fields.id),
                                    instanceAdminPermissionGroupId)));

            cq.where(predicate);
            // cq.select(root.get(PermissionGroup.Fields.id));
            return entityManager.createQuery(cq).getResultList().stream()
                    .map(PermissionGroup::getId)
                    .collect(Collectors.toSet());
        });
    }

    @Override
    public Mono<Set<String>> preFillAnonymousUserPermissionGroupIdsCache() {
        Set<String> roleIdsForAnonymousUser = inMemoryCacheableRepositoryHelper.getAnonymousUserPermissionGroupIds();

        if (roleIdsForAnonymousUser != null && !roleIdsForAnonymousUser.isEmpty()) {
            return Mono.just(inMemoryCacheableRepositoryHelper.getAnonymousUserPermissionGroupIds());
        }

        log.debug(
                "In memory cache miss for anonymous user permission groups. Fetching from DB and adding it to in memory storage.");

        final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        final CriteriaQuery<Config> cq = cb.createQuery(Config.class);
        final Root<Config> config = cq.from(Config.class);
        cq.where(cb.equal(config.get(Config.Fields.name), FieldName.PUBLIC_PERMISSION_GROUP));
        final TypedQuery<Config> query = entityManager.createQuery(cq);

        // All public access is via a single permission group. Fetch the same and set the cache with it.
        return Mono.fromSupplier(query::getSingleResult)
                .map(config1 -> Set.of(config1.getConfig().getAsString(PERMISSION_GROUP_ID)))
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

        Criteria anonymousUserCriteria = Criteria.where(User.Fields.email).is(ANONYMOUS_USER);
        Criteria tenantIdCriteria = Criteria.where(User.Fields.tenantId).is(tenantId);

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

        Criteria defaultTenantCriteria = Criteria.where(Tenant.Fields.slug).is(FieldName.DEFAULT);
        Query query = new Query();
        query.addCriteria(defaultTenantCriteria);

        return mongoOperations.findOne(query, Tenant.class).flatMap(defaultTenant -> {
            inMemoryCacheableRepositoryHelper.setDefaultTenantId(defaultTenant.getId());
            return getAnonymousUser(defaultTenant.getId());
        }); // */
    }

    @Override
    public Mono<String> getDefaultTenantId() {
        String defaultTenantId = inMemoryCacheableRepositoryHelper.getDefaultTenantId();
        if (defaultTenantId != null && !defaultTenantId.isEmpty()) {
            return Mono.just(defaultTenantId);
        }

        Criteria defaultTenantCriteria = Criteria.where(Tenant.Fields.slug).is(FieldName.DEFAULT);
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
        return Mono.just(instanceAdminPermissionGroupId);
    }
}
