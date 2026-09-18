package com.appsmith.server.repositories;

import com.appsmith.server.domains.McpToken;
import com.appsmith.server.enums.McpTokenStatus;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface McpTokenRepository extends BaseRepository<McpToken, String>, CustomMcpTokenRepository {

    Flux<McpToken> findByMcpKeyIdAndStatus(String mcpKeyId, McpTokenStatus status);

    Flux<McpToken> findByMcpKeyIdInAndStatus(Collection<String> mcpKeyIds, McpTokenStatus status);

    Flux<McpToken> findByMcpKeyIdInAndStatusIn(Collection<String> mcpKeyIds, Collection<McpTokenStatus> status);

    Mono<McpToken> findFirstByMcpKeyIdAndStatusOrderByCreatedAtDesc(String mcpKeyId, McpTokenStatus status);
}
