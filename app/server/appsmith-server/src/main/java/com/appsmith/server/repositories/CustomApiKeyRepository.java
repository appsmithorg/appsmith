package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserApiKey;
import reactor.core.publisher.Mono;

public interface CustomApiKeyRepository extends AppsmithRepository<UserApiKey> {
    Mono<UserApiKey> getByUserIdWithoutPermission(String userId);
}
