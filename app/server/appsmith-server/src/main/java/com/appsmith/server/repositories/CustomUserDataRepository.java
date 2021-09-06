package com.appsmith.server.repositories;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

public interface CustomUserDataRepository extends AppsmithRepository<UserData> {

    Mono<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version);

    Mono<UpdateResult> removeOrgFromRecentlyUsedList(String userId, String organizationId);
}
