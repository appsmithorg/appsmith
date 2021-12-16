package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomUserDataRepositoryCE extends AppsmithRepository<UserData> {

    Mono<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version);

    Mono<UpdateResult> removeIdFromRecentlyUsedList(String userId, String organizationId, List<String> applicationIds);
}
