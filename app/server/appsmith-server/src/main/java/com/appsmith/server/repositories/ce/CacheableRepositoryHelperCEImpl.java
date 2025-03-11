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
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.OrganizationSpan.FETCH_ORGANIZATION_FROM_DB_SPAN;
import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.ANONYMOUS_USER;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;
import static org.springframework.util.StringUtils.hasLength;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelperCE {
    private final ReactiveMongoOperations mongoOperations;
    private final ObservationRegistry observationRegistry;
    private static final String CACHE_DEFAULT_PAGE_ID_TO_DEFAULT_APPLICATION_ID = "pageIdToAppId";
    private static String defaultOrganizationId;
    private final InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper;

    @Cache(cacheName = "permissionGroupsForUser", key = "{#user.email + #user.organizationId}")
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
                || user.getId().isEmpty()
                || user.getOrganizationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.SESSION_BAD_STATE));
        }

        Mono<Query> createQueryMono = getOrganizationAdminPermissionGroupId(user.getOrganizationId())
                .map(organizationAdminPermissionGroupId -> {
                    BridgeQuery<PermissionGroup> assignedToUserIdsCriteria =
                            Bridge.equal(PermissionGroup.Fields.assignedToUserIds, user.getId());

                    BridgeQuery<PermissionGroup> notDeletedCriteria = notDeleted();

                    // The roles should be either workspace default roles, user management role, or instance admin role
                    BridgeQuery<PermissionGroup> ceSupportedRolesCriteria = Bridge.or(
                            Bridge.equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName()),
                            Bridge.equal(PermissionGroup.Fields.defaultDomainType, User.class.getSimpleName()),
                            Bridge.equal(PermissionGroup.Fields.id, organizationAdminPermissionGroupId));

                    BridgeQuery<PermissionGroup> andCriteria =
                            Bridge.and(assignedToUserIdsCriteria, notDeletedCriteria, ceSupportedRolesCriteria);

                    Query query = new Query();
                    query.addCriteria(andCriteria);

                    // Since we are only interested in the permission group ids, we can project only the id field.
                    query.fields().include(PermissionGroup.Fields.id);

                    return query;
                });

        return createQueryMono
                .map(query -> mongoOperations.find(query, PermissionGroup.class))
                .flatMapMany(obj -> obj)
                .map(permissionGroup -> permissionGroup.getId())
                .collect(Collectors.toSet());
    }

    @Override
    public Mono<String> getOrganizationAdminPermissionGroupId(String organizationId) {

        String organizationAdminPermissionGroupId =
                inMemoryCacheableRepositoryHelper.getOrganizationAdminPermissionGroupId(organizationId);
        if (hasLength(organizationAdminPermissionGroupId)) {
            return Mono.just(organizationAdminPermissionGroupId);
        }

        // Find the permission group id of the organization admin
        BridgeQuery<PermissionGroup> andCriteria = Bridge.and(
                Bridge.equal(PermissionGroup.Fields.defaultDomainType, Organization.class.getSimpleName()),
                Bridge.equal(PermissionGroup.Fields.defaultDomainId, organizationId));

        Query query = new Query();
        query.addCriteria(andCriteria);

        // Since we are only interested in the permission group ids, we can project only the id field.
        query.fields().include(PermissionGroup.Fields.id);

        return mongoOperations
                .find(query, PermissionGroup.class)
                .map(permissionGroup -> permissionGroup.getId())
                .next()
                .doOnSuccess(
                        permissionGroupId -> inMemoryCacheableRepositoryHelper.setOrganizationAdminPermissionGroupId(
                                organizationId, permissionGroupId));
    }

    @Override
    public Mono<Set<String>> preFillAnonymousUserPermissionGroupIdsCache() {
        Set<String> roleIdsForAnonymousUser = inMemoryCacheableRepositoryHelper.getAnonymousUserPermissionGroupIds();

        if (roleIdsForAnonymousUser != null && !roleIdsForAnonymousUser.isEmpty()) {
            return Mono.just(inMemoryCacheableRepositoryHelper.getAnonymousUserPermissionGroupIds());
        }

        log.debug(
                "In memory cache miss for anonymous user permission groups. Fetching from DB and adding it to in memory storage.");

        BridgeQuery<Config> query = Bridge.equal(Config.Fields.name, FieldName.PUBLIC_PERMISSION_GROUP);
        // All public access is via a single permission group. Fetch the same and set the cache with it.
        return mongoOperations
                .findOne(Query.query(query), Config.class)
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

    @CacheEvict(cacheName = "permissionGroupsForUser", key = "{#email + #organizationId}")
    @Override
    public Mono<Void> evictPermissionGroupsUser(String email, String organizationId) {
        return Mono.empty();
    }

    @Override
    public Mono<String> getCurrentUserOrganizationId() {
        String defaultOrganizationId = inMemoryCacheableRepositoryHelper.getDefaultOrganizationId();
        if (defaultOrganizationId != null && !defaultOrganizationId.isEmpty()) {
            return Mono.just(defaultOrganizationId);
        }

        BridgeQuery<Organization> defaultOrganizationCriteria =
                Bridge.equal(Organization.Fields.slug, FieldName.DEFAULT);
        Query query = new Query();
        query.addCriteria(defaultOrganizationCriteria);

        return mongoOperations.findOne(query, Organization.class).map(defaultOrganization -> {
            String newDefaultOrganizationId = defaultOrganization.getId();
            inMemoryCacheableRepositoryHelper.setDefaultOrganizationId(newDefaultOrganizationId);
            return newDefaultOrganizationId;
        });
    }

    /**
     * Returns the default organization from the cache if present.
     * If not present in cache, then it fetches the default organization from the database and adds to redis.
     * @param organizationId
     * @return
     */
    @Cache(cacheName = "organization", key = "{#organizationId}")
    @Override
    public Mono<Organization> getOrganizationById(String organizationId) {
        BridgeQuery<Organization> idCriteria = Bridge.equal(Organization.Fields.id, organizationId);
        BridgeQuery<Organization> notDeletedCriteria = notDeleted();
        BridgeQuery<Organization> andCriteria = Bridge.and(idCriteria, notDeletedCriteria);
        Query query = new Query();
        query.addCriteria(andCriteria);
        log.info("Fetching organization {} from database as it couldn't be found in the cache!", organizationId);
        return mongoOperations
                .findOne(query, Organization.class)
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
