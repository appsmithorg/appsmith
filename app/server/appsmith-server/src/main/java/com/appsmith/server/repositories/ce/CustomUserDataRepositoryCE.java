package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

    Mono<Integer> saveReleaseNotesViewedVersion(String userId, String version);

    Mono<Void> removeEntitiesFromRecentlyUsedList(String userId, String workspaceId);

    Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId);

    Mono<Void> removeApplicationFromFavorites(String applicationId);

    /**
     * Add an application to a single user's favorites list using an atomic update.
     *
     * @param userId        ID of the user whose favorites list should be updated
     * @param applicationId ID of the application to add to favorites
     * @return Completion signal when the update operation finishes
     */
    Mono<Void> addFavoriteApplicationForUser(String userId, String applicationId);

    /**
     * Atomically add an application to a user's favorites list only if the list
     * has fewer than {@code maxLimit} entries.  Uses a single conditional MongoDB
     * update ({@code $addToSet} + array-index existence check) so the limit
     * cannot be exceeded by concurrent requests.
     *
     * @param userId        ID of the user whose favorites list should be updated
     * @param applicationId ID of the application to add to favorites
     * @param maxLimit      Maximum allowed size of the favorites list
     * @return Number of matched documents: 1 if the update was applied,
     *         0 if the array already had {@code maxLimit} or more entries
     */
    Mono<Integer> addFavoriteApplicationForUserIfUnderLimit(String userId, String applicationId, int maxLimit);

    /**
     * Atomically remove an application from a user's favorites list only if it
     * is present.  The query matches the user document only when the array
     * contains {@code applicationId}, so the returned count doubles as a
     * "was-it-actually-removed?" signal.
     *
     * @param userId        ID of the user whose favorites list should be updated
     * @param applicationId ID of the application to remove from favorites
     * @return Number of matched documents: 1 if the application was removed,
     *         0 if it was not in the favorites list
     */
    Mono<Integer> removeFavoriteApplicationForUser(String userId, String applicationId);
}
