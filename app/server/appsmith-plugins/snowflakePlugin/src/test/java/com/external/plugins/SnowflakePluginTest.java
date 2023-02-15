package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.exceptions.SnowflakeErrorMessages;
import com.external.plugins.exceptions.SnowflakePluginError;
import com.external.utils.ExecutionUtils;
import com.external.utils.ValidationUtils;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
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
import java.util.*;
import java.util.stream.Collectors;

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
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_USERNAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_WAREHOUSE_NAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_DATABASE_NAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_SCHEMA_NAME_ERROR_MSG));
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

        final HikariPoolMXBean hikariPoolMXBean = mock(HikariPoolMXBean.class);
        when(hikariPoolMXBean.getActiveConnections())
                .thenReturn(1);
        when(hikariPoolMXBean.getIdleConnections())
                .thenReturn(4);
        when(hikariPoolMXBean.getTotalConnections())
                .thenReturn(5);
        when(hikariPoolMXBean.getThreadsAwaitingConnection())
                .thenReturn(0);

        final HikariDataSource hikariDataSource = mock(HikariDataSource.class);
        when(hikariDataSource.getConnection())
                .thenReturn(connection);
        when(hikariDataSource.isClosed())
                .thenReturn(false);
        when(hikariDataSource.isRunning())
                .thenReturn(true);
        when(hikariDataSource.getHikariPoolMXBean())
                .thenReturn(hikariPoolMXBean);

        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(testQuery);
        final Mono<ActionExecutionResult> actionExecutionResultMono =
                pluginExecutor.execute(hikariDataSource, new DatasourceConfiguration(), actionConfiguration);

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

    @Test
    public void verifyUniquenessOfSnowflakePluginErrorCode() {
        assert (Arrays.stream(SnowflakePluginError.values()).map(SnowflakePluginError::getAppErrorCode).distinct().count() == SnowflakePluginError.values().length);

        assert (Arrays.stream(SnowflakePluginError.values()).map(SnowflakePluginError::getAppErrorCode)
                .filter(appErrorCode-> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-SNW"))
                .collect(Collectors.toList()).size() == 0);

    }
}
