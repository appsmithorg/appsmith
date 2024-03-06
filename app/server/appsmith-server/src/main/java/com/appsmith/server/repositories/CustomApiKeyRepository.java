package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserApiKey;
import reactor.core.publisher.Flux;

public interface CustomApiKeyRepository extends AppsmithRepository<UserApiKey> {
    Flux<UserApiKey> getByUserIdWithoutPermission(String userId);
}
