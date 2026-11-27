package com.external.plugins;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.external.plugins.exceptions.FirestoreErrorMessages;
import com.google.api.gax.grpc.GrpcStatusCode;
import com.google.api.gax.rpc.ApiExceptionFactory;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreException;
import io.grpc.Status;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

/**
 * The message that Test configuration returns when Firestore refuses the connection check. The client is mocked to
 * throw the errors that a real project returns.
 */
@ExtendWith(MockitoExtension.class)
class FirestoreConnectionErrorsTest {

    @Mock
    private Firestore firestore;

    @Spy
    private FirestorePlugin.FirestorePluginExecutor pluginExecutor = new FirestorePlugin.FirestorePluginExecutor();

    static Stream<Arguments> permissionDeniedErrors() {
        return Stream.of(
                Arguments.of(null, serverError(Status.PERMISSION_DENIED, "Missing or insufficient permissions.")),
                Arguments.of("my-db", serverError(Status.PERMISSION_DENIED, "Missing or insufficient permissions.")),
                Arguments.of(
                        null,
                        serverError(
                                Status.PERMISSION_DENIED,
                                "Cloud Firestore API has not been used in project test-project before or it is disabled.")),
                Arguments.of(
                        null,
                        FirestoreException.forServerRejection(
                                Status.PERMISSION_DENIED, "Missing or insufficient permissions.")));
    }

    // Firestore answers PERMISSION_DENIED for a service account without a Firestore role and for a project where the
    // Firestore API is disabled.
    @ParameterizedTest
    @MethodSource("permissionDeniedErrors")
    void should_returnPermissionError_when_firestoreDeniesListingCollections(
            String databaseId, FirestoreException error) {
        // Given
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration(databaseId);
        when(firestore.listCollections()).thenThrow(error);
        doReturn(firestore).when(pluginExecutor).createClient(datasourceConfiguration);

        // When
        Mono<DatasourceTestResult> result = pluginExecutor.testDatasource(datasourceConfiguration);

        // Then
        StepVerifier.create(result)
                .assertNext(datasourceTestResult -> assertThat(datasourceTestResult.getInvalids())
                        .containsExactly(FirestoreErrorMessages.DS_PERMISSION_DENIED_ERROR_MSG))
                .verifyComplete();
    }

    static Stream<Arguments> notFoundErrorsByDatabaseId() {
        return Stream.of(
                Arguments.of(null, FirestoreErrorMessages.DS_CONNECTION_FAILED_FOR_PROJECT_ID),
                Arguments.of("my-db", FirestoreErrorMessages.DS_CONNECTION_FAILED_FOR_DATABASE_ID));
    }

    @ParameterizedTest
    @MethodSource("notFoundErrorsByDatabaseId")
    void should_returnConnectionError_when_firestoreReturnsNotFound(String databaseId, String expectedError) {
        // Given
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration(databaseId);
        when(firestore.listCollections()).thenThrow(serverError(Status.NOT_FOUND, "The database does not exist."));
        doReturn(firestore).when(pluginExecutor).createClient(datasourceConfiguration);

        // When
        Mono<DatasourceTestResult> result = pluginExecutor.testDatasource(datasourceConfiguration);

        // Then
        StepVerifier.create(result)
                .assertNext(datasourceTestResult ->
                        assertThat(datasourceTestResult.getInvalids()).containsExactly(expectedError))
                .verifyComplete();
    }

    // The shape that listCollections throws: a server error that the client wraps.
    private static FirestoreException serverError(Status status, String reason) {
        return FirestoreException.forApiException(ApiExceptionFactory.createException(
                status.withDescription(reason).asRuntimeException(), GrpcStatusCode.of(status.getCode()), false));
    }

    private static DatasourceConfiguration datasourceConfiguration(String databaseId) {
        DBAuth auth = new DBAuth();
        auth.setUsername("test-project");
        auth.setPassword("{}");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(auth);
        if (databaseId != null) {
            datasourceConfiguration.setProperties(List.of(new Property("Database ID", databaseId)));
        }
        return datasourceConfiguration;
    }
}
