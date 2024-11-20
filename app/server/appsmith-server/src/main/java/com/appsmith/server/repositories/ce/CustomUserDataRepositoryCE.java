package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Optional;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

    int saveReleaseNotesViewedVersion(String userId, String version, EntityManager entityManager);

    Optional<Void> removeEntitiesFromRecentlyUsedList(String userId, String workspaceId, EntityManager entityManager);

    Optional<String> fetchMostRecentlyUsedWorkspaceId(String userId, EntityManager entityManager);

    int updateByUserId(String userId, UserData userData, EntityManager entityManager);
}
