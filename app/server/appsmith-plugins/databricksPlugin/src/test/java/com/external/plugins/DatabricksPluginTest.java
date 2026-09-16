package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.DriverPropertyInfo;
import java.sql.SQLException;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Logger;

import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_INVALID_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_NULL_ERROR_MSG;
import static com.external.plugins.DatabricksPlugin.VALIDITY_CHECK_TIMEOUT;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

public class DatabricksPluginTest {

    private static final String INVALID_JDBC_URL_ERROR_MSG = "The JDBC URL must use the jdbc:databricks:// protocol.";

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

    @Test
    void datasourceCreate_rejectsNonDatabricksJdbcUrl() throws SQLException {
        SentinelDriver sentinelDriver = new SentinelDriver();
        DriverManager.registerDriver(sentinelDriver);

        try {
            StepVerifier.create(databricksPluginExecutor.datasourceCreate(rawUrlDatasource("jdbc:sentinel:controlled")))
                    .expectErrorMatches(error -> error instanceof AppsmithPluginException
                            && error.getMessage().contains(INVALID_JDBC_URL_ERROR_MSG))
                    .verify();

            assertFalse(sentinelDriver.wasInvoked());
        } finally {
            DriverManager.deregisterDriver(sentinelDriver);
        }
    }

    @Test
    void datasourceCreate_acceptsDatabricksJdbcUrl() throws SQLException {
        Driver driver = Mockito.mock(Driver.class);
        Connection connection = Mockito.mock(Connection.class);
        String url = "jdbc:databricks://example.invalid:443/default";
        Mockito.when(driver.connect(Mockito.eq(url), Mockito.any(Properties.class)))
                .thenReturn(connection);
        DatabricksPlugin.DatabricksPluginExecutor executor = new DatabricksPlugin.DatabricksPluginExecutor(driver);

        StepVerifier.create(executor.datasourceCreate(rawUrlDatasource(url)))
                .expectNext(connection)
                .verifyComplete();

        ArgumentCaptor<Properties> propertiesCaptor = ArgumentCaptor.forClass(Properties.class);
        Mockito.verify(driver).connect(Mockito.eq(url), propertiesCaptor.capture());
        assertEquals("token", propertiesCaptor.getValue().get("UID"));
        assertEquals("test-token", propertiesCaptor.getValue().get("PWD"));
    }

    private static DatasourceConfiguration rawUrlDatasource(String url) {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(new BearerTokenAuth("test-token"));
        datasourceConfiguration.setProperties(List.of(
                new Property("configurationType", "JDBC_URL_CONFIGURATION"),
                new Property("httpPath", null),
                new Property("catalog", null),
                new Property("schema", null),
                new Property("userAgent", null),
                new Property("jdbcUrl", url)));
        return datasourceConfiguration;
    }

    private static final class SentinelDriver implements Driver {

        private final AtomicBoolean invoked = new AtomicBoolean();
        private final Connection connection = Mockito.mock(Connection.class);

        @Override
        public Connection connect(String url, Properties info) {
            if (!acceptsURL(url)) {
                return null;
            }
            invoked.set(true);
            return connection;
        }

        @Override
        public boolean acceptsURL(String url) {
            return url != null && url.startsWith("jdbc:sentinel:");
        }

        @Override
        public DriverPropertyInfo[] getPropertyInfo(String url, Properties info) {
            return new DriverPropertyInfo[0];
        }

        @Override
        public int getMajorVersion() {
            return 1;
        }

        @Override
        public int getMinorVersion() {
            return 0;
        }

        @Override
        public boolean jdbcCompliant() {
            return false;
        }

        @Override
        public Logger getParentLogger() {
            return Logger.getGlobal();
        }

        boolean wasInvoked() {
            return invoked.get();
        }
    }
}
