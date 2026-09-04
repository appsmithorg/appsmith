package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.McpKey;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface McpKeyRepositoryCE extends BaseRepository<McpKey, String> {

    Mono<McpKey> findByIdAndUserIdAndRevokedAtIsNull(String id, String userId);

    Flux<McpKey> findAllByUserIdAndRevokedAtIsNull(String userId);

    Flux<McpKey> findAllByUserId(String userId);

    Mono<Long> countByUserIdAndRevokedAtIsNull(String userId);
}
