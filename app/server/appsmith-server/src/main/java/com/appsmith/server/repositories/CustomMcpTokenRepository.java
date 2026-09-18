package com.appsmith.server.repositories;

import com.appsmith.server.enums.McpTokenStatus;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Mono;

public interface CustomMcpTokenRepository {

    // A key is supposed to have a single ACTIVE token. This matches every row with that status so a stray extra is
    // retired in the same write as a rotate rather than left live beside the newly inserted credential.
    Mono<Integer> updateByMcpKeyIdAndStatus(String mcpKeyId, McpTokenStatus status, Update update);
}
