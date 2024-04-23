package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

    Mono<Integer> saveReleaseNotesViewedVersion(String userId, String version);

    Mono<Void> removeEntitiesFromRecentlyUsedList(String userId, String workspaceId);

    Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId);
}
