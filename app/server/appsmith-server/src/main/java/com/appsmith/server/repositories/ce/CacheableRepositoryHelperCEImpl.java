package com.appsmith.server.repositories.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
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

import static com.appsmith.external.constants.spans.OrganizationSpan.FETCH_ORGANIZATION_FROM_DB_SPAN;
import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.ANONYMOUS_USER;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_CONFIG;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelperCE {
    private final EntityManager entityManager;
    private final InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper;
    private final ObservationRegistry observationRegistry;
    private static final String CACHE_DEFAULT_PAGE_ID_TO_DEFAULT_APPLICATION_ID = "pageIdToAppId";

    @Cache(cacheName = "permissionGroupsForUser", key = "{#user.email + #user.organizationId}")
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
                            cb.equal(root.get(PermissionGroup.Fields.defaultDomainType), User.class.getSimpleName()),
                            cb.equal(root.get(PermissionGroup.Fields.id), instanceAdminPermissionGroupId)));

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

    @CacheEvict(cacheName = "permissionGroupsForUser", key = "{#email + #organizationId}")
    @Override
    public Mono<Void> evictPermissionGroupsUser(String email, String organizationId) {
        return Mono.empty();
    }

    @Override
    public Mono<String> getDefaultOrganizationId() {
        String defaultOrganizationId = inMemoryCacheableRepositoryHelper.getDefaultOrganizationId();
        if (defaultOrganizationId != null && !defaultOrganizationId.isEmpty()) {
            return Mono.just(defaultOrganizationId);
        }

        final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        final CriteriaQuery<Organization> cq = cb.createQuery(Organization.class);
        final Root<Organization> root = cq.from(Organization.class);

        Predicate defaultOrganizationCriteria = cb.equal(root.get(Organization.Fields.slug), FieldName.DEFAULT);
        Predicate andCriteria = cb.and(defaultOrganizationCriteria);

        cq.where(andCriteria);

        log.info("Fetching organization from database as it couldn't be found in the cache!");

        return asMono(() -> Optional.of(entityManager.createQuery(cq).getSingleResult()))
                .map(organization -> {
                    if (organization.getOrganizationConfiguration() == null) {
                        organization.setOrganizationConfiguration(new OrganizationConfiguration());
                    }
                    String newDefaultOrganizationId = organization.getId();
                    inMemoryCacheableRepositoryHelper.setDefaultOrganizationId(newDefaultOrganizationId);
                    return newDefaultOrganizationId;
                })
                .name(FETCH_ORGANIZATION_FROM_DB_SPAN)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Mono<String> getInstanceAdminPermissionGroupId() {
        String instanceAdminPermissionGroupId = inMemoryCacheableRepositoryHelper.getInstanceAdminPermissionGroupId();
        if (instanceAdminPermissionGroupId != null && !instanceAdminPermissionGroupId.isEmpty()) {
            return Mono.just(instanceAdminPermissionGroupId);
        }

        final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        final CriteriaQuery<Config> cq = cb.createQuery(Config.class);
        final Root<Config> root = cq.from(Config.class);

        cq.where(cb.equal(root.get(Config.Fields.name), INSTANCE_CONFIG));

        return asMono(() -> Optional.of(entityManager.createQuery(cq).getSingleResult()))
                .map(instanceConfig -> {
                    JSONObject config = instanceConfig.getConfig();
                    return (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
                })
                .doOnSuccess(permissionGroupId ->
                        inMemoryCacheableRepositoryHelper.setInstanceAdminPermissionGroupId(permissionGroupId));
    }

    /**
     * Returns the default organization from the cache if present.
     * If not present in cache, then it fetches the default organization from the database and adds to redis.
     * @param organizationId
     * @return
     */
    @Cache(cacheName = "organization", key = "{#organizationId}")
    @Override
    public Mono<Organization> fetchDefaultOrganization(String organizationId) {
        String defaultOrganizationId = inMemoryCacheableRepositoryHelper.getDefaultOrganizationId();

        final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        final CriteriaQuery<Organization> cq = cb.createQuery(Organization.class);
        final Root<Organization> root = cq.from(Organization.class);

        Predicate defaultOrganizationCriteria = cb.equal(root.get(Organization.Fields.slug), FieldName.DEFAULT);
        Predicate andCriteria = cb.and(defaultOrganizationCriteria);

        cq.where(andCriteria);

        log.info("Fetching organization from database as it couldn't be found in the cache!");

        return asMono(() -> Optional.of(entityManager.createQuery(cq).getSingleResult()))
                .map(organization -> {
                    if (organization.getOrganizationConfiguration() == null) {
                        organization.setOrganizationConfiguration(new OrganizationConfiguration());
                    }
                    return organization;
                })
                .name(FETCH_ORGANIZATION_FROM_DB_SPAN)
                .tap(Micrometer.observation(observationRegistry));
    }

    @CacheEvict(cacheName = "organization", key = "{#organizationId}")
    @Override
    public Mono<Void> evictCachedOrganization(String organizationId) {
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
