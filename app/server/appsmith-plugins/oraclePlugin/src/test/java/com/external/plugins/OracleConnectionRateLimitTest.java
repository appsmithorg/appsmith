package com.external.plugins;

import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;

import static com.external.plugins.OracleTestDBContainerManager.getDefaultDatasourceConfig;
import static org.junit.jupiter.api.Assertions.assertEquals;

@Testcontainers
public class OracleConnectionRateLimitTest {

    OraclePlugin.OraclePluginExecutor oraclePluginExecutor = new OraclePlugin.OraclePluginExecutor();

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @Container
    private static final OracleContainer oracleDB = OracleTestDBContainerManager.getOracleDBForTest();

    @Test
    public void testGetEndpointIdentifierForRateLimit_endpointNotPresent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = getDefaultDatasourceConfig(oracleDB);
        // setting endpoints to empty list
        dsConfig.setEndpoints(new ArrayList());

        final Mono<String> rateLimitIdentifierMono = oraclePluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(rateLimitIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAbsent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = getDefaultDatasourceConfig(oracleDB);

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("");
        dsConfig.getEndpoints().get(0).setPort(1521L);

        final Mono<String> endPointIdentifierMono = oraclePluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAndPortPresent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = getDefaultDatasourceConfig(oracleDB);

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(152L);

        final Mono<String> endPointIdentifierMono = oraclePluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_152", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostPresentPortAbsent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = getDefaultDatasourceConfig(oracleDB);

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(null);

        final Mono<String> endPointIdentifierMono = oraclePluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_1521", endpointIdentifier);
                })
                .verifyComplete();
    }
}
