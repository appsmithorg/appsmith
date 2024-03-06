package com.appsmith.server.services;

import com.appsmith.server.domains.UserApiKey;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import reactor.core.publisher.Mono;

public interface ApiKeyService extends CrudService<UserApiKey, String> {
    Mono<String> generateApiKey(ApiKeyRequestDto apiKeyRequestDto);

    Mono<String> generateApiKeyWithoutPermissionCheck(ApiKeyRequestDto apiKeyRequestDto);

    Mono<Boolean> archiveAllApiKeysForUser(String email);

    Mono<Boolean> archiveAllApiKeysForUserWithoutPermissionCheck(String email);
}
