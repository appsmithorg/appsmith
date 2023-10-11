package com.external.plugins;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static com.external.plugins.OracleTestDBContainerManager.getDefaultDatasourceConfig;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
public class OraclePluginConnectionTest {

    OraclePlugin.OraclePluginExecutor oraclePluginExecutor = new OraclePlugin.OraclePluginExecutor();

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @Container
    private static final OracleContainer oracleDB = OracleTestDBContainerManager.getOracleDBForTest();

    @Test
    public void testDatasourceConnectionTestPassWithValidConfig() {
        Mono<DatasourceTestResult> testDsResultMono =
                oraclePluginExecutor.testDatasource(getDefaultDatasourceConfig(oracleDB));
        StepVerifier.create(testDsResultMono)
                .assertNext(testResult -> {
                    assertEquals(0, testResult.getInvalids().size());
                })
                .verifyComplete();
    }

    @Test
    public void testDatasourceConnectionTestFailWithInvalidPassword() {
        DatasourceConfiguration invalidDsConfig = getDefaultDatasourceConfig(oracleDB);
        ((DBAuth) invalidDsConfig.getAuthentication()).setPassword("invalid_password");

        Mono<DatasourceTestResult> testDsResultMono = oraclePluginExecutor.testDatasource(invalidDsConfig);
        StepVerifier.create(testDsResultMono)
                .assertNext(testResult -> {
                    assertNotEquals(0, testResult.getInvalids().size());
                    String expectedError =
                            "Failed to initialize pool: ORA-01017: invalid username/password; logon " + "denied";
                    boolean isExpectedErrorReceived = testResult.getInvalids().stream()
                            .anyMatch(errorString -> expectedError.equals(errorString.trim()));
                    assertTrue(isExpectedErrorReceived);
                })
                .verifyComplete();
    }

    @Test
    public void testDatasourceConnectionTestFailWithInvalidUsername() {
        DatasourceConfiguration invalidDsConfig = getDefaultDatasourceConfig(oracleDB);
        ((DBAuth) invalidDsConfig.getAuthentication()).setUsername("invalid_username");

        Mono<DatasourceTestResult> testDsResultMono = oraclePluginExecutor.testDatasource(invalidDsConfig);
        StepVerifier.create(testDsResultMono)
                .assertNext(testResult -> {
                    assertNotEquals(0, testResult.getInvalids().size());
                    String expectedError =
                            "Failed to initialize pool: ORA-01017: invalid username/password; logon " + "denied";
                    boolean isExpectedErrorReceived = testResult.getInvalids().stream()
                            .anyMatch(errorString -> expectedError.equals(errorString.trim()));
                    assertTrue(isExpectedErrorReceived);
                })
                .verifyComplete();
    }
}
