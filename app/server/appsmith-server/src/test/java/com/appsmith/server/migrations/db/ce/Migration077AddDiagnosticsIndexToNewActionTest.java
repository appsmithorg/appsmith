package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewAction;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class Migration077AddDiagnosticsIndexToNewActionTest {

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private MongoDatabaseFactory databaseFactory;

    @Mock
    private MongoDatabase database;

    @Mock
    private IndexOperations indexOperations;

    @Test
    void should_startWithDatasourceId_when_indexIsCreated() {
        // Given
        stubMongo();

        // When
        new Migration077AddDiagnosticsIndexToNewAction(mongoTemplate).addDiagnosticsIndex();

        // Then
        ArgumentCaptor<Index> index = ArgumentCaptor.forClass(Index.class);
        verify(indexOperations).ensureIndex(index.capture());
        Document options = index.getValue().getIndexOptions();
        assertThat(index.getValue().getIndexKeys().keySet())
                .containsExactly(
                        "unpublishedAction.datasource._id",
                        "pluginType",
                        "deletedAt",
                        "deleted",
                        "unpublishedAction.deletedAt");
        assertThat(options.getString("name")).isEqualTo("diagnostics_editable_actions");
        assertThat(options.getBoolean("background")).isTrue();
        assertThat(options.containsKey("unique")).isFalse();
    }

    @Test
    void should_notThrow_when_indexBuildFails() {
        // Given
        stubMongo();
        when(indexOperations.ensureIndex(any()))
                .thenThrow(new UncategorizedMongoDbException("build failed", new IllegalStateException()));

        // When / Then
        assertThatCode(() -> new Migration077AddDiagnosticsIndexToNewAction(mongoTemplate).addDiagnosticsIndex())
                .doesNotThrowAnyException();
    }

    private void stubMongo() {
        when(mongoTemplate.getMongoDatabaseFactory()).thenReturn(databaseFactory);
        when(databaseFactory.getMongoDatabase()).thenReturn(database);
        when(database.getName()).thenReturn("appsmith");
        when(mongoTemplate.indexOps(NewAction.class)).thenReturn(indexOperations);
    }
}
