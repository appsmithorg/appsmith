package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserMcpToken;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserMcpTokenRepositoryCE extends BaseRepository<UserMcpToken, String> {

    Mono<UserMcpToken> findByTokenIdAndDeletedAtIsNull(String tokenId);

    Mono<UserMcpToken> findByTokenIdAndUserIdAndDeletedAtIsNull(String tokenId, String userId);

    Flux<UserMcpToken> findAllByUserIdAndDeletedAtIsNull(String userId);

    Mono<Long> countByUserIdAndDeletedAtIsNull(String userId);
}
