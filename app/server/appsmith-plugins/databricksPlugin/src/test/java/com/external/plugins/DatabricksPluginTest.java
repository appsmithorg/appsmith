package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.external.plugins.exceptions.DatabricksErrorMessages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.io.ClassPathResource;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_INVALID_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_NULL_ERROR_MSG;
import static com.external.plugins.DatabricksPlugin.VALIDITY_CHECK_TIMEOUT;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class DatabricksPluginTest {

    public DatabricksPlugin.DatabricksPluginExecutor databricksPluginExecutor;

    @BeforeEach
    public void setUp() {
        databricksPluginExecutor = new DatabricksPlugin.DatabricksPluginExecutor();
    }

    @Test
    public void testExecuteNullConnection() {
        Mono<ActionExecutionResult> executionResultMono =
                databricksPluginExecutor.execute(null, new DatasourceConfiguration(), new ActionConfiguration());

        StepVerifier.create(executionResultMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException
                        && throwable.getMessage().equals(CONNECTION_NULL_ERROR_MSG))
                .verify();
    }

    @Test
    public void testExecuteClosedConnection() throws SQLException {
        Connection mockConnection = Mockito.mock(Connection.class);
        Mockito.when(mockConnection.isClosed()).thenReturn(true);

        Mono<ActionExecutionResult> executionResultMono = databricksPluginExecutor.execute(
                mockConnection, new DatasourceConfiguration(), new ActionConfiguration());

        StepVerifier.create(executionResultMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException
                        && throwable.getMessage().equals(CONNECTION_CLOSED_ERROR_MSG))
                .verify();
    }

    @Test
    public void testExecuteInvalidConnection() throws SQLException {
        Connection mockConnection = Mockito.mock(Connection.class);
        Mockito.when(mockConnection.isValid(VALIDITY_CHECK_TIMEOUT)).thenReturn(false);

        Mono<ActionExecutionResult> executionResultMono = databricksPluginExecutor.execute(
                mockConnection, new DatasourceConfiguration(), new ActionConfiguration());

        StepVerifier.create(executionResultMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException
                        && throwable.getMessage().equals(CONNECTION_INVALID_ERROR_MSG))
                .verify();
    }

    // ------------------------------------------------------------------
    // Review-fix regression tests
    // ------------------------------------------------------------------

    /**
     * Runs executeParameterized against a connection where BOTH the prepared and raw paths return a no-result-set
     * (write) query, so a test can assert which path was chosen for a given prepared-statement setting.
     */
    private Connection runDatabricks(List<Property> templates) throws SQLException {
        Connection connection = mock(Connection.class);
        when(connection.isClosed()).thenReturn(false);
        when(connection.isValid(VALIDITY_CHECK_TIMEOUT)).thenReturn(true);

        PreparedStatement ps = mock(PreparedStatement.class);
        when(connection.prepareStatement(any())).thenReturn(ps);
        when(ps.execute()).thenReturn(false);

        Statement st = mock(Statement.class);
        when(connection.createStatement()).thenReturn(st);
        when(st.execute(anyString())).thenReturn(false);

        ActionConfiguration ac = new ActionConfiguration();
        ac.setBody("SELECT * FROM users WHERE name = {{Input1.text}}");
        ac.setPluginSpecifiedTemplates(templates);

        ExecuteActionDTO dto = new ExecuteActionDTO();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("value");
        param.setClientDataType(ClientDataType.STRING);
        dto.setParams(List.of(param));

        StepVerifier.create(databricksPluginExecutor.executeParameterized(
                        connection, dto, new DatasourceConfiguration(), ac))
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
        return connection;
    }

    /**
     * The prepared path binds a value as a `?` placeholder and preserves the no-result-set write behavior (a
     * synthetic success body), without ever taking the raw Statement path.
     */
    @Test
    public void testExecuteParameterizedPreparedStatementBindsAndPreservesWriteBehavior() throws SQLException {
        Connection connection = mock(Connection.class);
        when(connection.isClosed()).thenReturn(false);
        when(connection.isValid(VALIDITY_CHECK_TIMEOUT)).thenReturn(true);

        PreparedStatement ps = mock(PreparedStatement.class);
        when(connection.prepareStatement(any())).thenReturn(ps);
        // No result set: an update/insert/delete-style statement.
        when(ps.execute()).thenReturn(false);

        ActionConfiguration ac = new ActionConfiguration();
        ac.setBody("SELECT * FROM users WHERE name = {{Input1.text}}");
        ac.setPluginSpecifiedTemplates(List.of(new Property("preparedStatement", "true")));

        final String paramValue = "O'Reilly -- value";
        ExecuteActionDTO dto = new ExecuteActionDTO();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue(paramValue);
        param.setClientDataType(ClientDataType.STRING);
        dto.setParams(List.of(param));

        StepVerifier.create(databricksPluginExecutor.executeParameterized(
                        connection, dto, new DatasourceConfiguration(), ac))
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    // No-result-set write returns the synthetic success body.
                    assertTrue(result.getBody().toString().contains("success"));
                })
                .verifyComplete();

        verify(connection).prepareStatement("SELECT * FROM users WHERE name = ?");
        verify(ps).setString(eq(1), eq(paramValue));
        verify(connection, never()).createStatement();
        verify(ps).close();
    }

    /** The prepared-statement setting defaults to ON when absent or malformed. */
    @Test
    public void testPreparedStatementDefaultsOnWhenSettingAbsentOrMalformed() throws SQLException {
        Property boolTrue = new Property();
        boolTrue.setKey("preparedStatement");
        boolTrue.setValue(Boolean.TRUE);

        for (List<Property> templates : Arrays.asList(
                (List<Property>) null,
                new ArrayList<Property>(),
                Arrays.asList((Property) null),
                List.of(new Property("preparedStatement", "true")),
                List.of(new Property("preparedStatement", "banana")),
                List.of(boolTrue))) {
            Connection connection = runDatabricks(templates);
            verify(connection).prepareStatement("SELECT * FROM users WHERE name = ?");
            verify(connection, never()).createStatement();
        }
    }

    /** Raw execution is used only when the user explicitly disables prepared statements. */
    @Test
    public void testRawStatementOnlyWhenExplicitlyDisabled() throws SQLException {
        Property boolFalse = new Property();
        boolFalse.setKey("preparedStatement");
        boolFalse.setValue(Boolean.FALSE);

        for (List<Property> templates :
                Arrays.asList(List.of(new Property("preparedStatement", "false")), List.of(boolFalse))) {
            Connection connection = runDatabricks(templates);
            verify(connection).createStatement();
            verify(connection, never()).prepareStatement(any());
        }
    }

    /** Array-typed params cannot be bound as scalar JDBC parameters and must fail with a clear message. */
    @Test
    public void testExecuteParameterizedRejectsArrayParams() throws SQLException {
        Connection connection = mock(Connection.class);
        when(connection.isClosed()).thenReturn(false);
        when(connection.isValid(VALIDITY_CHECK_TIMEOUT)).thenReturn(true);

        PreparedStatement ps = mock(PreparedStatement.class);
        when(connection.prepareStatement(any())).thenReturn(ps);

        ActionConfiguration ac = new ActionConfiguration();
        ac.setBody("SELECT * FROM t WHERE id = {{Input1.ids}}");
        ac.setPluginSpecifiedTemplates(List.of(new Property("preparedStatement", "true")));

        ExecuteActionDTO dto = new ExecuteActionDTO();
        Param param = new Param();
        param.setKey("Input1.ids");
        param.setValue("[1, 2, 3]");
        param.setClientDataType(ClientDataType.ARRAY);
        dto.setParams(List.of(param));

        StepVerifier.create(databricksPluginExecutor.executeParameterized(
                        connection, dto, new DatasourceConfiguration(), ac))
                .expectErrorMatches(e -> e instanceof AppsmithPluginException
                        && e.getMessage()
                                .contains(String.format(
                                        DatabricksErrorMessages.ARRAY_PARAMETER_NOT_SUPPORTED_ERROR_MSG, "Input1.ids")))
                .verify();

        verify(connection, never()).createStatement();
        verify(ps).close();
    }

    /** The plugin ships a dependency.json so the client re-evaluates the query body when the toggle flips. */
    @Test
    public void testDependencyConfigLinksBodyToPreparedStatementToggle() throws IOException {
        InputStream input = new ClassPathResource("dependency.json").getInputStream();
        String content = new BufferedReader(new InputStreamReader(input))
                .lines()
                .collect(Collectors.joining(System.lineSeparator()));
        assertTrue(content.contains("actionConfiguration.body"));
        assertTrue(content.contains("actionConfiguration.pluginSpecifiedTemplates[0].value"));
    }
}
