package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.McpKey;
import com.appsmith.server.domains.McpToken;
import com.appsmith.server.domains.ce.McpKeyCE;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

/**
 * Compound indexes for MCP key management and token auth. {@code deletedAt} is on both so the
 * soft-delete overlay ({@code deletedAt: null}) can use the index. None of these are unique: rotate
 * keeps historical ROTATED rows, and a unique ACTIVE-per-key constraint is not enforced in Mongo.
 */
@Slf4j
@ChangeUnit(order = "076", id = "add-mcp-key-and-token-indexes", author = "")
public class Migration076AddMcpKeyAndTokenIndices {

    public static final String MCP_KEY_USER_REVOKED_DELETED = "mcp_key_user_revoked_deleted";
    public static final String MCP_TOKEN_KEY_STATUS_DELETED = "mcp_token_key_status_deleted";

    private final MongoTemplate mongoTemplate;

    public Migration076AddMcpKeyAndTokenIndices(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // Indexes are retained to avoid degrading token authentication or token-management queries.
    }

    @Execution
    public void addIndicesToMcpKeyAndToken() {
        ensureMcpKeyIndex();
        ensureMcpTokenIndex();
    }

    private void ensureMcpKeyIndex() {
        // list/count live keys: userId + revokedAt is null + deletedAt is null
        Index index = makeIndex(McpKeyCE.Fields.userId, McpKeyCE.Fields.revokedAt, BaseDomain.Fields.deletedAt)
                .named(MCP_KEY_USER_REVOKED_DELETED)
                .background();
        createIndex(McpKey.class, MCP_KEY_USER_REVOKED_DELETED, index);
    }

    private void ensureMcpTokenIndex() {
        // auth, rotate, list, revoke: mcpKeyId + status + deletedAt is null
        Index index = makeIndex(McpToken.Fields.mcpKeyId, McpToken.Fields.status, BaseDomain.Fields.deletedAt)
                .named(MCP_TOKEN_KEY_STATUS_DELETED)
                .background();
        createIndex(McpToken.class, MCP_TOKEN_KEY_STATUS_DELETED, index);
    }

    private void createIndex(Class<?> entityClass, String indexName, Index index) {
        dropIndexIfExists(mongoTemplate, entityClass, indexName);
        try {
            ensureIndexes(mongoTemplate, entityClass, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    indexName,
                    exception.getMessage());
        } catch (Exception exception) {
            log.error("An error occurred while creating the index : {}", indexName, exception);
        }
    }
}
