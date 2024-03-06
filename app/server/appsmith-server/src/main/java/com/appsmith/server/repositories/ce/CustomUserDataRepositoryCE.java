package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

    Mono<Integer> saveReleaseNotesViewedVersion(String userId, String version);

    Mono<Void> removeIdFromRecentlyUsedList(String userId, String workspaceId, List<String> applicationIds);

    Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId);
}
