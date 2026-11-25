package com.appsmith.server.repositories.ce;

import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.domains.NewAction;
import com.mongodb.MongoCommandException;
import com.mongodb.ServerAddress;
import io.micrometer.observation.ObservationRegistry;
import org.bson.BsonDocument;
import org.bson.BsonInt32;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import static com.appsmith.server.migrations.db.ce.Migration077AddDiagnosticsIndexToNewAction.DIAGNOSTICS_EDITABLE_ACTIONS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomNewActionRepositoryDiagnosticsTest {

    private static final int BAD_VALUE = 2;
    private static final int MAX_TIME_EXPIRED = 50;

    @Mock
    private ReactiveMongoOperations mongoOperations;

    @Test
    void should_notRetry_when_aggregationTimesOut() {
        // Given
        UncategorizedMongoDbException timeout = commandFailure(MAX_TIME_EXPIRED);
        givenAggregations(Flux.error(timeout), Flux.just(new Document()));

        // When
        Flux<Document> counts = repository().countEditableByPluginTypeForDiagnostics();

        // Then
        StepVerifier.create(counts)
                .verifyErrorSatisfies(error -> assertThat(error).isSameAs(timeout));
        verify(mongoOperations, times(1)).aggregate(any(Aggregation.class), anyString(), eq(Document.class));
    }

    @Test
    void should_retryWithoutHintAndKeepTimeLimit_when_hintIsRejected() {
        // Given
        Document count = new Document("_id", "DB").append("count", 1);
        givenAggregations(Flux.error(commandFailure(BAD_VALUE)), Flux.just(count));

        // When
        Flux<Document> counts = repository().countEditableByPluginTypeForDiagnostics();

        // Then
        StepVerifier.create(counts).expectNext(count).verifyComplete();
        ArgumentCaptor<Aggregation> aggregations = ArgumentCaptor.forClass(Aggregation.class);
        verify(mongoOperations, times(2)).aggregate(aggregations.capture(), anyString(), eq(Document.class));
        assertThat(aggregations.getAllValues())
                .extracting(aggregation -> aggregation.getOptions().getMaxTime())
                .containsOnly(DiagnosticsValues.AGGREGATION_OPTIONS.getMaxTime());
        assertThat(aggregations.getAllValues().get(0).getOptions().getHintObject())
                .contains(DIAGNOSTICS_EDITABLE_ACTIONS);
        assertThat(aggregations.getAllValues().get(1).getOptions().getHintObject())
                .isEmpty();
    }

    @Test
    void should_notMakeOtherDatasourceIndexesEligible_when_countRetriesWithoutHint() {
        // Given
        givenAggregations(Flux.error(commandFailure(BAD_VALUE)), Flux.empty());

        // When
        Flux<Document> counts = repository().countEditableByPluginTypeForDiagnostics();

        // Then
        StepVerifier.create(counts).verifyComplete();
        ArgumentCaptor<Aggregation> aggregations = ArgumentCaptor.forClass(Aggregation.class);
        verify(mongoOperations, times(2)).aggregate(aggregations.capture(), anyString(), eq(Document.class));
        assertThat(aggregations.getAllValues())
                .extracting(aggregation -> aggregation
                        .toPipeline(Aggregation.DEFAULT_CONTEXT)
                        .toString()
                        .contains("datasource._id"))
                .containsExactly(true, false);
    }

    private CustomNewActionRepositoryCEImpl repository() {
        return new CustomNewActionRepositoryCEImpl(mongoOperations, ObservationRegistry.NOOP);
    }

    private void givenAggregations(Flux<Document> first, Flux<Document> second) {
        when(mongoOperations.getCollectionName(NewAction.class)).thenReturn("newAction");
        when(mongoOperations.aggregate(any(Aggregation.class), eq("newAction"), eq(Document.class)))
                .thenReturn(first, second);
    }

    private static UncategorizedMongoDbException commandFailure(int code) {
        BsonDocument response = new BsonDocument("ok", new BsonInt32(0)).append("code", new BsonInt32(code));
        return new UncategorizedMongoDbException(
                "command failed", new MongoCommandException(response, new ServerAddress()));
    }
}
