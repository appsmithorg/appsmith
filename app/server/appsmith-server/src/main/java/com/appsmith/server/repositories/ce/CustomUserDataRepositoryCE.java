package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;

import java.util.List;
import java.util.Optional;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

    Optional<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version);

    Optional<UpdateResult> removeIdFromRecentlyUsedList(String userId, String workspaceId, List<String> applicationIds);

    List<UserData> findPhotoAssetsByUserIds(Iterable<String> userId);

    Optional<String> fetchMostRecentlyUsedWorkspaceId(String userId);
}
