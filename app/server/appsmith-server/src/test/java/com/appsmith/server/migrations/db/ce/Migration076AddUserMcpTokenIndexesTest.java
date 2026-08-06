package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.UserMcpToken;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Answers.RETURNS_DEEP_STUBS;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test for the Mongock change unit that adds the UserMcpToken indexes (M3-T4). Mocks MongoTemplate /
 * IndexOperations and verifies the migration ensures the two expected indexes and is idempotent when re-run — the
 * change unit itself carries no "already applied" guard, so re-execution must simply re-issue the (idempotent)
 * ensureIndex calls without throwing.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class Migration076AddUserMcpTokenIndexesTest {

    private static final String TOKEN_ID_INDEX = "user_mcp_token_token_id";
    private static final String USER_DELETED_AT_INDEX = "user_mcp_token_user_deleted_at";

    @Mock(answer = RETURNS_DEEP_STUBS)
    private MongoTemplate mongoTemplate;

    @Mock
    private IndexOperations indexOperations;

    private static String indexName(Index index) {
        return (String) index.getIndexOptions().get("name");
    }

    @Test
    void addUserMcpTokenIndexes_createsTheExpectedIndexes() {
        // ensureIndexes reads the DB name to length-check index names; give it a realistic non-null value.
        when(mongoTemplate.getMongoDatabaseFactory().getMongoDatabase().getName())
                .thenReturn("appsmith");
        when(mongoTemplate.indexOps(UserMcpToken.class)).thenReturn(indexOperations);

        new Migration076AddUserMcpTokenIndexes(mongoTemplate).addUserMcpTokenIndexes();

        ArgumentCaptor<Index> indexCaptor = ArgumentCaptor.forClass(Index.class);
        verify(indexOperations, times(2)).ensureIndex(indexCaptor.capture());

        List<String> ensuredNames = indexCaptor.getAllValues().stream()
                .map(Migration076AddUserMcpTokenIndexesTest::indexName)
                .toList();
        assertThat(ensuredNames).containsExactlyInAnyOrder(TOKEN_ID_INDEX, USER_DELETED_AT_INDEX);
    }

    @Test
    void addUserMcpTokenIndexes_isIdempotentAcrossReRuns() {
        when(mongoTemplate.getMongoDatabaseFactory().getMongoDatabase().getName())
                .thenReturn("appsmith");
        when(mongoTemplate.indexOps(UserMcpToken.class)).thenReturn(indexOperations);

        Migration076AddUserMcpTokenIndexes migration = new Migration076AddUserMcpTokenIndexes(mongoTemplate);

        // Re-running the change unit (e.g. a replayed Mongock changelog) must not throw and must re-issue the same
        // idempotent ensureIndex calls rather than duplicating or corrupting index state.
        assertThatCode(() -> {
                    migration.addUserMcpTokenIndexes();
                    migration.addUserMcpTokenIndexes();
                })
                .doesNotThrowAnyException();

        // Two indexes ensured per run, twice — the utility issues one ensureIndex per index each time and MongoDB
        // treats a repeated ensureIndex on an identical definition as a no-op.
        verify(indexOperations, times(4)).ensureIndex(any(Index.class));
    }
}
