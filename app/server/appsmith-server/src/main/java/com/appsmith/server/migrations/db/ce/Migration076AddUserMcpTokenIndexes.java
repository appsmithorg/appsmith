package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.UserMcpToken;
import com.appsmith.server.domains.ce.UserMcpTokenCE;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order = "076", id = "add-user-mcp-token-indexes", author = "")
public class Migration076AddUserMcpTokenIndexes {

    private final MongoTemplate mongoTemplate;

    public Migration076AddUserMcpTokenIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // Indexes are retained to avoid degrading token authentication or token-management queries.
    }

    @Execution
    public void addUserMcpTokenIndexes() {
        Index tokenIdIndex = makeIndex(UserMcpTokenCE.Fields.tokenId)
                .named("user_mcp_token_token_id")
                .unique()
                .background();
        Index activeTokensByUserIndex = makeIndex(UserMcpTokenCE.Fields.userId, "deletedAt")
                .named("user_mcp_token_user_deleted_at")
                .background();

        ensureIndexes(mongoTemplate, UserMcpToken.class, tokenIdIndex, activeTokensByUserIndex);
    }
}
