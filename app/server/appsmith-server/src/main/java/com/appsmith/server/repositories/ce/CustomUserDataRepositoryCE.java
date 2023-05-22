/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import java.util.List;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

Mono<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version);

Mono<UpdateResult> removeIdFromRecentlyUsedList(
	String userId, String workspaceId, List<String> applicationIds);

Flux<UserData> findPhotoAssetsByUserIds(Iterable<String> userId);

Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId);
}
