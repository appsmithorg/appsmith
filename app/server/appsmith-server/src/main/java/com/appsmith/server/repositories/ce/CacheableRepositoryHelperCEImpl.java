package com.appsmith.server.repositories.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import io.micrometer.observation.ObservationRegistry;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.TenantSpan.FETCH_TENANT_FROM_DB_SPAN;
import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.ANONYMOUS_USER;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_CONFIG;
import static com.appsmith.server.constants.ce.FieldNameCE.TX_CONTEXT;
import static com.appsmith.server.helpers.ReactorUtils.asMono;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelperCE {
    private final EntityManager defaultEntityManager;
    private final InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper;
    private final ObservationRegistry observationRegistry;
    private static final String CACHE_DEFAULT_PAGE_ID_TO_DEFAULT_APPLICATION_ID = "pageIdToAppId";

    @Cache(cacheName = "permissionGroupsForUser", key = "{#user.email + #user.tenantId}")
    @Override
    public Mono<Set<String>> getPermissionGroupsOfUser(User user) {
        return getPermissionGroupsOfUser(user, defaultEntityManager);
    }
    /**
     * Returns the permission groups of the user. If the user is anonymous, then it returns the permission groups of
     * the anonymous user.
     * @param user          The user whose permission groups are
     * @param entityManager The entity manager to use for fetching the permission groups, as we expect the permission
     *                      groups will change over time for the user we are making requests with custom entity manager
     *                      that can be passed by the consumer. This is helpful if the consumer wants to fetch the
     *                      permission groups in a transactional context.
     * @return    A set of permission group ids
     */
    @Cache(cacheName = "permissionGroupsForUser", key = "{#user.email + #user.tenantId}")
    @Override
    public Mono<Set<String>> getPermissionGroupsOfUser(User user, EntityManager entityManager) {

        // If the user is anonymous, then we don't need to fetch the permission groups from the database. We can just
        // return the cached permission group ids.
        if (ANONYMOUS_USER.equals(user.getUsername())) {
            return getPermissionGroupsOfAnonymousUser();
        }

        if (user.getEmail() == null || user.getEmail().isEmpty() || user.getId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.SESSION_BAD_STATE));
        }
        Mono<EntityManager> entityManagerMono;
        if (entityManager == null) {
            entityManagerMono = Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)));
        } else {
            entityManagerMono = Mono.just(entityManager);
        }

        return getInstanceAdminPermissionGroupId().zipWith(entityManagerMono).map(tuple2 -> {
            final String instanceAdminPermissionGroupId = tuple2.getT1();
            EntityManager em = tuple2.getT2();
            final CriteriaBuilder cb = em.getCriteriaBuilder();
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
                            cb.equal(root.get(PermissionGroup.Fields.defaultDomainType), User.class.getSimpleName()),
                            cb.equal(root.get(PermissionGroup.Fields.id), instanceAdminPermissionGroupId)));

            cq.where(predicate);
            // cq.select(root.get(PermissionGroup.Fields.id));
            return em.createQuery(cq).getResultList().stream()
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

        final CriteriaBuilder cb = defaultEntityManager.getCriteriaBuilder();
        final CriteriaQuery<Config> cq = cb.createQuery(Config.class);
        final Root<Config> config = cq.from(Config.class);
        cq.where(cb.equal(config.get(Config.Fields.name), FieldName.PUBLIC_PERMISSION_GROUP));
        final TypedQuery<Config> query = defaultEntityManager.createQuery(cq);

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
    public Mono<String> getDefaultTenantId() {
        String defaultTenantId = inMemoryCacheableRepositoryHelper.getDefaultTenantId();
        if (defaultTenantId != null && !defaultTenantId.isEmpty()) {
            return Mono.just(defaultTenantId);
        }

        final CriteriaBuilder cb = defaultEntityManager.getCriteriaBuilder();
        final CriteriaQuery<String> cq = cb.createQuery(String.class);
        final Root<Tenant> root = cq.from(Tenant.class);

        cq.where(cb.equal(root.get(Tenant.Fields.slug), FieldName.DEFAULT));
        cq.select(root.get(Tenant.Fields.id));

        final String id = defaultEntityManager.createQuery(cq).getSingleResult();

        if (id != null) {
            inMemoryCacheableRepositoryHelper.setDefaultTenantId(id);
        }

        return Mono.justOrEmpty(id);
    }

    @Override
    public Mono<String> getInstanceAdminPermissionGroupId() {
        String instanceAdminPermissionGroupId = inMemoryCacheableRepositoryHelper.getInstanceAdminPermissionGroupId();
        if (instanceAdminPermissionGroupId != null && !instanceAdminPermissionGroupId.isEmpty()) {
            return Mono.just(instanceAdminPermissionGroupId);
        }

        final CriteriaBuilder cb = defaultEntityManager.getCriteriaBuilder();
        final CriteriaQuery<Config> cq = cb.createQuery(Config.class);
        final Root<Config> root = cq.from(Config.class);

        cq.where(cb.equal(root.get(Config.Fields.name), INSTANCE_CONFIG));

        return asMono(() -> Optional.of(defaultEntityManager.createQuery(cq).getSingleResult()))
                .map(instanceConfig -> {
                    JSONObject config = instanceConfig.getConfig();
                    return (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
                })
                .doOnSuccess(permissionGroupId ->
                        inMemoryCacheableRepositoryHelper.setInstanceAdminPermissionGroupId(permissionGroupId));
    }

    /**
     * Returns the default tenant from the cache if present.
     * If not present in cache, then it fetches the default tenant from the database and adds to redis.
     * @param tenantId
     * @return
     */
    @Cache(cacheName = "tenant", key = "{#tenantId}")
    @Override
    public Mono<Tenant> fetchDefaultTenant(String tenantId) {
        log.info("Fetching tenant from database as it couldn't be found in the cache!");

        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, defaultEntityManager)))
                .flatMap(em -> {
                    BridgeQuery<Tenant> defaultTenantCriteria = Bridge.equal(Tenant.Fields.slug, FieldName.DEFAULT);
                    BridgeQuery<Tenant> notDeletedCriteria = notDeleted();
                    BridgeQuery<Tenant> andCriteria = Bridge.and(defaultTenantCriteria, notDeletedCriteria);

                    final CriteriaBuilder cb = em.getCriteriaBuilder();
                    final CriteriaQuery<Tenant> cq = cb.createQuery(Tenant.class);
                    final Root<Tenant> root = cq.from(Tenant.class);

                    cq.where(andCriteria.toPredicate(root, cq, cb));
                    return asMono(() -> Optional.of(em.createQuery(cq).getSingleResult()));
                })
                .map(tenant -> {
                    if (tenant.getTenantConfiguration() == null) {
                        tenant.setTenantConfiguration(new TenantConfiguration());
                    }
                    return tenant;
                })
                .name(FETCH_TENANT_FROM_DB_SPAN)
                .tap(Micrometer.observation(observationRegistry));
    }

    @CacheEvict(cacheName = "tenant", key = "{#tenantId}")
    @Override
    public Mono<Void> evictCachedTenant(String tenantId) {
        return Mono.empty().then();
    }

    @Cache(cacheName = CACHE_DEFAULT_PAGE_ID_TO_DEFAULT_APPLICATION_ID, key = "{#basePageId}")
    @Override
    public Mono<String> fetchBaseApplicationId(String basePageId, String baseApplicationId) {
        return !StringUtils.hasText(baseApplicationId) ? Mono.empty() : Mono.just(baseApplicationId);
    }

    @CacheEvict(cacheName = CACHE_DEFAULT_PAGE_ID_TO_DEFAULT_APPLICATION_ID, keys = "#basePageIds")
    @Override
    public Mono<Boolean> evictCachedBasePageIds(List<String> basePageIds) {
        return Mono.just(Boolean.TRUE);
    }
}
