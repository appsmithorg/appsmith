package com.appsmith.server.repositories;

import com.appsmith.server.domains.McpToken;
import com.appsmith.server.enums.McpTokenStatus;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Mono;

public class CustomMcpTokenRepositoryImpl extends BaseAppsmithRepositoryImpl<McpToken>
        implements CustomMcpTokenRepository {

    @Override
    public Mono<Integer> updateByMcpKeyIdAndStatus(String mcpKeyId, McpTokenStatus status, Update update) {
        return queryBuilder()
                .criteria(Bridge.equal(McpToken.Fields.mcpKeyId, mcpKeyId))
                .criteria(Bridge.equal(McpToken.Fields.status, status))
                .updateAll(update);
    }
}
