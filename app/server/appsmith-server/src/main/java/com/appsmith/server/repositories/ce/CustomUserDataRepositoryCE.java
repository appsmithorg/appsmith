package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Optional;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

    int saveReleaseNotesViewedVersion(String userId, String version);

    Optional<Void> removeIdFromRecentlyUsedList(String userId, String workspaceId, List<String> applicationIds);

    Optional<String> fetchMostRecentlyUsedWorkspaceId(String userId);

    int updateByUserId(String userId, UserData userData);
}
