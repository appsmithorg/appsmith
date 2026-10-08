package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginErrorCode;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.external.plugins.exceptions.DynamoErrorMessages;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.test.StepVerifier;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The region, entered as the datasource's database name, is trimmed and must be a region name: letters, digits and
 * hyphens, 1 to 63 characters. Other values are rejected with a message that does not repeat them.
 */
class DynamoPluginRegionTest {

    private static final DynamoPlugin.DynamoPluginExecutor EXECUTOR = new DynamoPlugin.DynamoPluginExecutor();
    private static final List<String> INVALID_REGIONS = List.of(
            "us east 1", "us-east-1.attacker.example", "us_east_1", "us-east-1/", "région-1", "   ", "a".repeat(64));

    static Stream<Arguments> pathsAndInvalidRegions() {
        return Stream.of(DynamoClientPath.values())
                .flatMap(path -> INVALID_REGIONS.stream().map(region -> Arguments.of(path, region)));
    }

    static Stream<String> invalidRegions() {
        return INVALID_REGIONS.stream();
    }

    @ParameterizedTest(name = "{0} [{1}]")
    @MethodSource("pathsAndInvalidRegions")
    void should_failWithInvalidRegionError_when_regionIsNotARegionName(DynamoClientPath path, String region) {
        // Given
        DatasourceConfiguration datasource = datasource(region);

        // When
        StepVerifier.create(path.create(datasource))

                // Then
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    AppsmithPluginException pluginError = (AppsmithPluginException) error;
                    assertThat(pluginError.getAppErrorCode())
                            .isEqualTo(AppsmithPluginErrorCode.PLUGIN_DATASOURCE_ARGUMENT_ERROR.getCode());
                    assertThat(pluginError.getMessage()).isEqualTo(DynamoErrorMessages.INVALID_REGION_ERROR_MSG);
                })
                .verify(Duration.ofSeconds(30));
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_useTrimmedRegion_when_regionHasSurroundingWhitespace(DynamoClientPath path) {
        // Given
        DatasourceConfiguration datasource = datasource(" ap-south-1 ");

        // When
        DynamoDbClient client = path.create(datasource).block(Duration.ofSeconds(30));

        // Then
        try {
            assertThat(client.serviceClientConfiguration().region()).isEqualTo(Region.AP_SOUTH_1);
        } finally {
            client.close();
        }
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_failWithMissingRegionError_when_regionIsEmpty(DynamoClientPath path) {
        // Given
        DatasourceConfiguration datasource = datasource("");

        // When
        StepVerifier.create(path.create(datasource))

                // Then
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    assertThat(error.getMessage()).isEqualTo(DynamoErrorMessages.MISSING_REGION_ERROR_MSG);
                })
                .verify(Duration.ofSeconds(30));
    }

    @ParameterizedTest
    @MethodSource("invalidRegions")
    void should_reportInvalidRegion_when_validatingDatasourceWithInvalidRegion(String region) {
        // Given
        DatasourceConfiguration datasource = datasource(region);

        // When
        Set<String> invalids = EXECUTOR.validateDatasource(datasource);

        // Then
        assertThat(invalids).containsExactly(DynamoErrorMessages.INVALID_REGION_ERROR_MSG);
    }

    @ParameterizedTest
    @ValueSource(strings = {"ap-south-1", " ap-south-1 ", "us-gov-west-1", "eu-isoe-west-1", "local"})
    void should_reportNoInvalids_when_validatingDatasourceWithRegionName(String region) {
        // Given
        DatasourceConfiguration datasource = datasource(region);

        // When
        Set<String> invalids = EXECUTOR.validateDatasource(datasource);

        // Then
        assertThat(invalids).isEmpty();
    }

    private static DatasourceConfiguration datasource(String region) {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("localhost");
        endpoint.setPort(8000L);
        DBAuth auth = new DBAuth();
        auth.setUsername("access-key");
        auth.setPassword("secret-key");
        auth.setDatabaseName(region);
        DatasourceConfiguration datasource = new DatasourceConfiguration();
        datasource.setAuthentication(auth);
        datasource.setEndpoints(List.of(endpoint));
        return datasource;
    }
}
