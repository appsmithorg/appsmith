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
     * Remove an application from a single user's favorites list using an atomic update.
     *
     * @param userId        ID of the user whose favorites list should be updated
     * @param applicationId ID of the application to remove from favorites
     * @return Completion signal when the update operation finishes
     */
    Mono<Void> removeFavoriteApplicationForUser(String userId, String applicationId);
}
