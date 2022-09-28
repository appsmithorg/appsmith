package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.utils.ExecutionUtils;
import com.external.utils.ValidationUtils;
import lombok.extern.slf4j.Slf4j;
import net.snowflake.client.jdbc.SnowflakeReauthenticationRequest;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.stubbing.Answer;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@Slf4j
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
    public void testValidationUtils_withBadDatabaseName() {

        // Mock datasourceCreate method to return mockConnection.
        Connection mockConnection = mock(Connection.class);

        // Mock getRowsFromQueryResult method to return row list.
        List<Map<String, Object>> rowList = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("DATABASE", null);
        rowList.add(row);
        Set<String> invalids;

        try (MockedStatic<ExecutionUtils> executionUtilsMockedStatic = mockStatic(ExecutionUtils.class)) {
            executionUtilsMockedStatic.when(() -> ExecutionUtils.getRowsFromQueryResult(any(), anyString())).thenAnswer((Answer<List>) invocation -> rowList);
            invalids = ValidationUtils.validateWarehouseDatabaseSchema(mockConnection);
        }

        // Check test datasource failure.
        assertNotNull(invalids);
        assertEquals(invalids.size(), 1);

        // Match error statement.
        Set<String> expectedInvalids = new HashSet<>();
        expectedInvalids.add("Appsmith could not find any valid database configured for this datasource" +
                ". Please provide a valid database by editing the Database field in the datasource " +
                "configuration page.");
        assertEquals(expectedInvalids, invalids);
    }
}
