package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.external.utils.ExecutionUtils;
import lombok.extern.log4j.Log4j;
import net.snowflake.client.jdbc.SnowflakeReauthenticationRequest;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;
import static org.powermock.api.mockito.PowerMockito.mockStatic;

@Log4j
@RunWith(PowerMockRunner.class)
@PrepareForTest(ExecutionUtils.class)
public class SnowflakePluginTest {

    SnowflakePlugin.SnowflakePluginExecutor pluginExecutor = new SnowflakePlugin.SnowflakePluginExecutor();

    @Test
    public void testValidateDatasource_withInvalidCredentials_returnsInvalids() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setUsername(null);
        auth.setPassword(null);
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setProperties(List.of(new Property(), new Property()));
        Set<String> output = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertTrue(output.contains("Missing username for authentication."));
        assertTrue(output.contains("Missing password for authentication."));
        assertTrue(output.contains("Missing Snowflake URL."));
        assertTrue(output.contains("Missing warehouse name."));
        assertTrue(output.contains("Missing database name."));
        assertTrue(output.contains("Missing schema name."));
    }

    @Test
    public void testExecute_authenticationTimeout_returnsStaleConnectionException() throws SQLException {
        final String testQuery = "testQuery";
        final Connection connection = mock(Connection.class);
        when(connection.isValid(30))
                .thenReturn(true);
        final Statement statement = mock(Statement.class);
        when(connection.createStatement())
                .thenReturn(statement);
        when(statement.executeQuery(testQuery))
                .thenThrow(new SnowflakeReauthenticationRequest(
                        "1",
                        "Authentication token expired",
                        "",
                        0));
        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(testQuery);
        final Mono<ActionExecutionResult> actionExecutionResultMono =
                pluginExecutor.execute(connection, new DatasourceConfiguration(), actionConfiguration);

        StepVerifier.create(actionExecutionResultMono)
                .expectErrorMatches(e -> e instanceof StaleConnectionException)
                .verify();
    }

    /**
     * Although this test verifies error with bad database name, the exact same flow would also apply to bad schema
     * and warehouse name - hence not replicating the tests for schema or warehouse - as it would provide no extra
     * coverage.
     */
    @Test
    public void test_testDatasource_withBadDatabaseName() {
        // Create spyPluginExecutor to mock internal methods.
        SnowflakePlugin.SnowflakePluginExecutor spyPluginExecutor = spy(SnowflakePlugin.SnowflakePluginExecutor.class);

        // Mock datasourceCreate method to return mockConnection.
        Connection mockConnection = mock(Connection.class);
        doReturn(Mono.just(mockConnection)).when(spyPluginExecutor).datasourceCreate(any());

        // Mock getRowsFromQueryResult method to return row list.
        List<Map<String, Object>> rowList = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("DATABASE", null);
        rowList.add(row);
        mockStatic(ExecutionUtils.class);
        when(ExecutionUtils.getRowsFromQueryResult(any(), anyString())).thenAnswer((Answer<List>) invocation -> rowList);

        Mono<DatasourceTestResult> dsTestResult = spyPluginExecutor.testDatasource(new DatasourceConfiguration());
        StepVerifier.create(dsTestResult)
                .assertNext(result -> {
                    // Check test datasource failure.
                    assertFalse(result.isSuccess());
                    assertEquals(result.getInvalids().size(), 1);

                    // Match error statement.
                    Set<String> expectedInvalids = new HashSet<>();
                    expectedInvalids.add("Appsmith could not find any valid database configured for this datasource" +
                            ". Please provide a valid database by editing the Database field in the datasource " +
                            "configuration page.");
                    assertEquals(expectedInvalids, result.getInvalids());
                })
                .verifyComplete();
    }

    /**
     * Although this test verifies error with bad database name, the exact same flow would also apply to bad schema
     * and warehouse name - hence not replicating the tests for schema or warehouse - as it would provide no extra
     * coverage.
     */
    @Test
    public void test_getStructure_withBadDatabaseName() throws SQLException {
        // Create spyPluginExecutor to mock internal methods.
        SnowflakePlugin.SnowflakePluginExecutor spyPluginExecutor = spy(SnowflakePlugin.SnowflakePluginExecutor.class);

        // Create mockConnection object to mock isValid method.
        Connection mockConnection = mock(Connection.class);
        when(mockConnection.isValid(anyInt())).thenReturn(true);

        // Mock getRowsFromQueryResult method to return row list.
        List<Map<String, Object>> rowList = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("DATABASE", null);
        rowList.add(row);
        mockStatic(ExecutionUtils.class);
        when(ExecutionUtils.getRowsFromQueryResult(any(), anyString())).thenAnswer((Answer<List>) invocation -> rowList);

        Mono<DatasourceStructure> structure = spyPluginExecutor.getStructure(mockConnection, new DatasourceConfiguration());
        StepVerifier.create(structure)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof AppsmithPluginException);

                    String expectedErrorMessage = "Appsmith could not find any valid database configured for this " +
                            "datasource. Please provide a valid database by editing the Database field in the " +
                            "datasource configuration page.";
                    assertEquals(expectedErrorMessage, error.getMessage());
                })
                .verify();
    }
}
