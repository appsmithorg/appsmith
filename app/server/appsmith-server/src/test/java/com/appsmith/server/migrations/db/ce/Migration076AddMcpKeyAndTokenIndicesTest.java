package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.McpKey;
import com.appsmith.server.domains.McpToken;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Answers.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class Migration076AddMcpKeyAndTokenIndicesTest {

    @Mock(answer = RETURNS_DEEP_STUBS)
    private MongoTemplate mongoTemplate;

    @Mock
    private IndexOperations mcpKeyIndexOperations;

    @Mock
    private IndexOperations mcpTokenIndexOperations;

    private Migration076AddMcpKeyAndTokenIndices migration;

    @BeforeEach
    void setUp() {
        when(mongoTemplate.getMongoDatabaseFactory().getMongoDatabase().getName())
                .thenReturn("appsmith");
        when(mongoTemplate.indexOps(McpKey.class)).thenReturn(mcpKeyIndexOperations);
        when(mongoTemplate.indexOps(McpToken.class)).thenReturn(mcpTokenIndexOperations);
        migration = new Migration076AddMcpKeyAndTokenIndices(mongoTemplate);
    }

    @Test
    void should_createCompoundIndexOnMcpKey_whenMigrationRuns() {
        migration.addIndicesToMcpKeyAndToken();

        ArgumentCaptor<Index> indexCaptor = ArgumentCaptor.forClass(Index.class);
        verify(mcpKeyIndexOperations).ensureIndex(indexCaptor.capture());
        Index index = indexCaptor.getValue();

        assertThat(index.getIndexOptions().get("name"))
                .isEqualTo(Migration076AddMcpKeyAndTokenIndices.MCP_KEY_USER_REVOKED_DELETED);
        assertThat(index.getIndexKeys())
                .isEqualTo(new Document("userId", 1).append("revokedAt", 1).append("deletedAt", 1));
        assertThat(index.getIndexOptions().get("unique")).isNotEqualTo(Boolean.TRUE);
        assertThat(index.getIndexOptions().get("background")).isEqualTo(true);
    }

    @Test
    void should_createCompoundIndexOnMcpToken_whenMigrationRuns() {
        migration.addIndicesToMcpKeyAndToken();

        ArgumentCaptor<Index> indexCaptor = ArgumentCaptor.forClass(Index.class);
        verify(mcpTokenIndexOperations).ensureIndex(indexCaptor.capture());
        Index index = indexCaptor.getValue();

        assertThat(index.getIndexOptions().get("name"))
                .isEqualTo(Migration076AddMcpKeyAndTokenIndices.MCP_TOKEN_KEY_STATUS_DELETED);
        assertThat(index.getIndexKeys())
                .isEqualTo(new Document("mcpKeyId", 1).append("status", 1).append("deletedAt", 1));
        assertThat(index.getIndexOptions().get("unique")).isNotEqualTo(Boolean.TRUE);
        assertThat(index.getIndexOptions().get("background")).isEqualTo(true);
    }
}
