package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.BsonObjectId;
import com.google.cloud.firestore.BsonTimestamp;
import com.google.cloud.firestore.Decimal128Value;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Int32Value;
import com.google.cloud.firestore.RegexValue;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.constants.FieldName.COMMAND;
import static com.external.constants.FieldName.PATH;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * The Firestore client decodes these values from maps with reserved keys. The emulator does not store them, so the
 * client is mocked. FirestoreSdkBehaviourTest covers vectors against the emulator.
 */
@ExtendWith(MockitoExtension.class)
class FirestoreReservedMapsTest {

    @Mock
    private Firestore connection;

    @Mock
    private DocumentReference reference;

    @Mock
    private DocumentSnapshot snapshot;

    @InjectMocks
    private FirestorePlugin.FirestorePluginExecutor pluginExecutor;

    static Stream<Arguments> valuesThatFirestoreStoresAsReservedMaps() {
        return Stream.of(
                Arguments.of(new Int32Value(7), Map.of("__int__", 7)),
                Arguments.of(new Decimal128Value("1.5"), Map.of("__decimal128__", "1.5")),
                Arguments.of(
                        new BsonObjectId("507f191e810c19729de860ea"), Map.of("__oid__", "507f191e810c19729de860ea")),
                Arguments.of(
                        new BsonTimestamp(5, 2),
                        Map.of("__request_timestamp__", Map.of("seconds", 5L, "increment", 2L))),
                Arguments.of(new RegexValue("^a", "i"), Map.of("__regex__", Map.of("pattern", "^a", "options", "i"))));
    }

    @ParameterizedTest
    @MethodSource("valuesThatFirestoreStoresAsReservedMaps")
    void should_returnReservedMap_when_documentHasValueThatFirestoreStoresAsMap(Object value, Object expected) {
        // Given
        when(connection.document("col/doc")).thenReturn(reference);
        when(reference.get()).thenReturn(ApiFutures.immediateFuture(snapshot));
        when(reference.getId()).thenReturn("doc");
        when(reference.getPath()).thenReturn("col/doc");
        when(snapshot.getReference()).thenReturn(reference);
        when(snapshot.getData())
                .thenReturn(Map.of(
                        "field", value, "inArray", List.of(value), "inMap", new HashMap<>(Map.of("field", value))));

        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, "GET_DOCUMENT");
        setDataValueSafelyInFormData(formData, PATH, "col/doc");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        // When
        Mono<ActionExecutionResult> result = pluginExecutor.executeParameterized(
                connection, new ExecuteActionDTO(), new DatasourceConfiguration(), actionConfiguration);

        // Then
        StepVerifier.create(result)
                .assertNext(executionResult -> assertThat(executionResult.getBody())
                        .isEqualTo(Map.of(
                                "_ref", Map.of("id", "doc", "path", "col/doc"),
                                "field", expected,
                                "inArray", List.of(expected),
                                "inMap", Map.of("field", expected))))
                .verifyComplete();
    }
}
