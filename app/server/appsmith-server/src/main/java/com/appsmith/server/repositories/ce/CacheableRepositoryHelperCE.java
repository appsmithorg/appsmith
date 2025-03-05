package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CacheableRepositoryHelperCE {

    Mono<Set<String>> getPermissionGroupsOfUser(User user);

    Mono<String> getOrganizationAdminPermissionGroupId(String organizationId);

    Mono<Set<String>> preFillAnonymousUserPermissionGroupIdsCache();

    Mono<Set<String>> getPermissionGroupsOfAnonymousUser();

    Mono<Void> evictPermissionGroupsUser(String email, String organizationId);

    Mono<String> getCurrentUserOrganizationId();

    Mono<Organization> getOrganizationById(String organizationId);

    Mono<Void> evictCachedOrganization(String organizationId);

    /**
     * Retrieves the base application ID from the cache based on the provided base page ID.
     *
     * <p>If the cache contains the ID for the specified {@code basePageId}, it is returned as a {@code Mono} containing the {@code baseApplicationId}.
     * If the cache does not contain the ID (cache miss) and {@code baseApplicationId} is {@code null} or empty, an empty {@code Mono} is returned.</p>
     *
     * <p>If {@code baseApplicationId} is not {@code null} or empty and a cache miss occurs, the cache will be updated with the provided {@code baseApplicationId}.</p>
     *
     * <p>Note that calling this method with a {@code null} {@code baseApplicationId} on a cache miss will not update the cache.
     * In this case, the method will return an empty {@code Mono}, and no cache update will occur.</p>
     *
     * @param basePageId the identifier for the base page used as the cache key
     * @param baseApplicationId the base application ID to be returned or used to update the cache if not {@code null} or empty
     * @return a {@code Mono} containing the {@code baseApplicationId} if it is present in the cache or provided; otherwise, an empty {@code Mono} on a cache miss with a {@code null} or empty {@code baseApplicationId}.
     *
     * <p>On a cache miss, if {@code baseApplicationId} is provided, the cache will be updated with the new value after performing additional database operations to fetch the application document.</p>
     */
    Mono<String> fetchBaseApplicationId(String basePageId, String baseApplicationId);

    Mono<Boolean> evictCachedBasePageIds(List<String> basePageIds);
}
