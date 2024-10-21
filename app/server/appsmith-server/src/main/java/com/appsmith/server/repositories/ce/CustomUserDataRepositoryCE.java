package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Optional;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

    int saveReleaseNotesViewedVersion(String userId, String version);

    Optional<Void> removeEntitiesFromRecentlyUsedList(String userId, String workspaceId);

    Optional<String> fetchMostRecentlyUsedWorkspaceId(String userId);

    int updateByUserId(String userId, UserData userData);
}
