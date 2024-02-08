package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.SQLException;

import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_INVALID_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_NULL_ERROR_MSG;
import static com.external.plugins.DatabricksPlugin.VALIDITY_CHECK_TIMEOUT;

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
}
