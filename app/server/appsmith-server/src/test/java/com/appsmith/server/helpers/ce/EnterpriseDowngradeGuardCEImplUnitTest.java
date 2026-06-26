package com.appsmith.server.helpers.ce;

import com.mongodb.reactivestreams.client.FindPublisher;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoCollection;
import com.mongodb.reactivestreams.client.MongoDatabase;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Lightweight, pure-Mockito unit tests for {@link EnterpriseDowngradeGuardCEImpl}. Unlike
 * {@code EnterpriseDowngradeGuardCEImplTest} (which boots a full {@code @SpringBootTest} context with
 * embedded Mongo), these tests drive the guard with a hand-mocked reactive {@link MongoClient} and so
 * run with no Spring context, no Mongo, and no Redis.
 *
 * <p>The key case here is the <b>fail-open</b> catch branch in
 * {@link EnterpriseDowngradeGuardCEImpl#assertNotEnterpriseDatabase}: when reading the Mongock audit
 * collection throws (an infrastructure/query failure), the guard must NOT abort startup.
 */
public class EnterpriseDowngradeGuardCEImplUnitTest {

    private static final String DATABASE_NAME = "appsmith";

    private final EnterpriseDowngradeGuardCEImpl guard = new EnterpriseDowngradeGuardCEImpl();

    // Required coverage: getDatabase(...) throws -> the guard fails OPEN (does not throw).
    @Test
    public void assertNotEnterpriseDatabase_whenMongoReadThrows_failsOpen() {
        final MongoClient mongoClient = mock(MongoClient.class);
        when(mongoClient.getDatabase(anyString())).thenThrow(new RuntimeException("simulated infra failure"));

        assertThatCode(() -> guard.assertNotEnterpriseDatabase(mongoClient, DATABASE_NAME))
                .doesNotThrowAnyException();
    }

    // Complementary happy-path: the audit query yields no EE document (first() emits nothing) ->
    // the guard returns without aborting startup.
    @Test
    public void assertNotEnterpriseDatabase_whenNoEeRecordFound_doesNotThrow() {
        @SuppressWarnings("unchecked")
        final MongoCollection<Document> collection = mock(MongoCollection.class);
        @SuppressWarnings("unchecked")
        final FindPublisher<Document> findPublisher = mock(FindPublisher.class);
        final MongoDatabase database = mock(MongoDatabase.class);
        final MongoClient mongoClient = mock(MongoClient.class);

        when(mongoClient.getDatabase(anyString())).thenReturn(database);
        when(database.getCollection(anyString())).thenReturn(collection);
        when(collection.find(any(org.bson.conversions.Bson.class))).thenReturn(findPublisher);
        when(findPublisher.limit(anyInt())).thenReturn(findPublisher);
        // first() returns an empty Publisher: Mono.from(...).block() resolves to null (no EE evidence).
        when(findPublisher.first()).thenReturn(Mono.empty());

        assertThatCode(() -> guard.assertNotEnterpriseDatabase(mongoClient, DATABASE_NAME))
                .doesNotThrowAnyException();
    }
}
