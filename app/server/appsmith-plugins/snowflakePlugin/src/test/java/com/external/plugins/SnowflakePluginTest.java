package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import lombok.extern.log4j.Log4j;
import net.snowflake.client.jdbc.SnowflakeReauthenticationRequest;
import org.junit.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Set;

import static org.junit.Assert.assertTrue;

@Log4j
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
    }

    @Test
    public void testExecute_authenticationTimeout_returnsStaleConnectionException() throws SQLException {
        final String testQuery = "testQuery";
        final Connection connection = Mockito.mock(Connection.class);
        Mockito.when(connection.isValid(30))
                .thenReturn(true);
        final Statement statement = Mockito.mock(Statement.class);
        Mockito.when(connection.createStatement())
                .thenReturn(statement);
        Mockito.when(statement.executeQuery(testQuery))
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

}
