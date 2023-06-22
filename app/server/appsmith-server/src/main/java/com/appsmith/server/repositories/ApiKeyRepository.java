package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserApiKey;
import reactor.core.publisher.Mono;

public interface ApiKeyRepository extends BaseRepository<UserApiKey, String>, CustomApiKeyRepository {
    Mono<UserApiKey> findByApiKey(String apiKey);
}
