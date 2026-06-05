package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.SSHTunnelContext;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.spi.ConnectionFactoryOptions;
import io.r2dbc.spi.Option;
import org.junit.jupiter.api.Test;

import java.net.ServerSocket;
import java.util.ArrayList;

import static com.appsmith.external.models.Connection.Mode.READ_WRITE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Pure unit tests for {@link MySqlDatasourceUtils} that exercise the connection-string / SSL / pool building logic
 * without needing a live MySQL server. These complement the Testcontainers-based MySqlPluginTest, which cannot run
 * without Docker.
 */
public class MySqlDatasourceUtilsTest {

    /** A valid standard (non-SSH) datasource configuration with SSL set to DEFAULT. */
    private DatasourceConfiguration standardConfig() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();

        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "STANDARD"));
        dsConfig.setProperties(properties);

        dsConfig.setConnection(new Connection());
        dsConfig.getConnection().setMode(READ_WRITE);
        dsConfig.getConnection().setSsl(new SSLDetails());
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        ArrayList<Endpoint> endpoints = new ArrayList<>();
        endpoints.add(new Endpoint("mysqlHost", 3306L));
        dsConfig.setEndpoints(endpoints);

        dsConfig.setAuthentication(new DBAuth(null, "username", "password", "dbname"));

        return dsConfig;
    }

    private ConnectionContext<ConnectionPool> emptyContext() {
        return new ConnectionContext<>(null, null);
    }

    @Test
    public void testGetBuilder_standardConnection_usesEndpointHostAndPort() {
        DatasourceConfiguration dsConfig = standardConfig();

        ConnectionFactoryOptions options =
                MySqlDatasourceUtils.getBuilder(dsConfig, emptyContext()).build();

        assertEquals("mysqlHost", options.getValue(ConnectionFactoryOptions.HOST));
        assertEquals(3306, (int) options.getValue(ConnectionFactoryOptions.PORT));
        assertEquals("dbname", options.getValue(ConnectionFactoryOptions.DATABASE));
        assertEquals("username", options.getValue(ConnectionFactoryOptions.USER));
    }

    @Test
    public void testGetBuilder_sshConnection_usesLocalForwardedPort() {
        DatasourceConfiguration dsConfig = standardConfig();
        // Toggle the connection method to SSH (index 1 holds the connection-method property).
        dsConfig.getProperties().set(1, new Property("Connection method", "SSH"));

        // Simulate an established tunnel whose local forwarder is bound to a random free port.
        ServerSocket serverSocket = mock(ServerSocket.class);
        when(serverSocket.getLocalPort()).thenReturn(54321);
        SSHTunnelContext tunnelContext = new SSHTunnelContext(serverSocket, null, null);
        ConnectionContext<ConnectionPool> ctx = new ConnectionContext<>(null, tunnelContext);

        ConnectionFactoryOptions options =
                MySqlDatasourceUtils.getBuilder(dsConfig, ctx).build();

        // When SSH is enabled, traffic is routed through the local end of the tunnel, not the DB host directly.
        assertEquals("localhost", options.getValue(ConnectionFactoryOptions.HOST));
        assertEquals(54321, (int) options.getValue(ConnectionFactoryOptions.PORT));
    }

    @Test
    public void testGetBuilder_appendsServerTimezoneProperty() {
        DatasourceConfiguration dsConfig = standardConfig();
        // Index 0 carries the optional serverTimezone property; index 1 stays the connection-method toggle.
        dsConfig.getProperties().set(0, new Property("serverTimezone", "UTC"));

        ConnectionFactoryOptions options =
                MySqlDatasourceUtils.getBuilder(dsConfig, emptyContext()).build();

        assertEquals("UTC", options.getValue(Option.valueOf("serverTimezone")));
    }

    @Test
    public void testGetBuilder_noEndpoints_usesConfiguredUrl() {
        DatasourceConfiguration dsConfig = standardConfig();
        dsConfig.setEndpoints(new ArrayList<>());
        dsConfig.setUrl("r2dbc:pool:mariadb://customhost:3307/customdb");

        ConnectionFactoryOptions options =
                MySqlDatasourceUtils.getBuilder(dsConfig, emptyContext()).build();

        assertEquals("customhost", options.getValue(ConnectionFactoryOptions.HOST));
        assertEquals(3307, (int) options.getValue(ConnectionFactoryOptions.PORT));
    }

    @Test
    public void testAddSslOptions_required_enablesSsl() {
        DatasourceConfiguration dsConfig = standardConfig();
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.REQUIRED);

        ConnectionFactoryOptions.Builder ob = MySqlDatasourceUtils.getBuilder(dsConfig, emptyContext());
        ConnectionFactoryOptions options =
                MySqlDatasourceUtils.addSslOptionsToBuilder(dsConfig, ob).build();

        assertEquals(Boolean.TRUE, options.getValue(ConnectionFactoryOptions.SSL));
        assertEquals("required", options.getValue(Option.valueOf("sslMode")));
    }

    @Test
    public void testAddSslOptions_disabled_turnsSslOff() {
        DatasourceConfiguration dsConfig = standardConfig();
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DISABLED);

        ConnectionFactoryOptions.Builder ob = MySqlDatasourceUtils.getBuilder(dsConfig, emptyContext());
        ConnectionFactoryOptions options =
                MySqlDatasourceUtils.addSslOptionsToBuilder(dsConfig, ob).build();

        assertEquals(Boolean.FALSE, options.getValue(ConnectionFactoryOptions.SSL));
    }

    @Test
    public void testAddSslOptions_default_leavesSslUnset() {
        DatasourceConfiguration dsConfig = standardConfig(); // SSL auth type is DEFAULT

        ConnectionFactoryOptions.Builder ob = MySqlDatasourceUtils.getBuilder(dsConfig, emptyContext());
        ConnectionFactoryOptions options =
                MySqlDatasourceUtils.addSslOptionsToBuilder(dsConfig, ob).build();

        assertNull(options.getValue(ConnectionFactoryOptions.SSL));
    }

    @Test
    public void testAddSslOptions_unsupportedAuthType_throws() {
        DatasourceConfiguration dsConfig = standardConfig();
        // VERIFY_CA is not handled by the switch, so it must fall through to the unsupported-option error.
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.VERIFY_CA);

        ConnectionFactoryOptions.Builder ob = MySqlDatasourceUtils.getBuilder(dsConfig, emptyContext());
        assertThrows(AppsmithPluginException.class, () -> MySqlDatasourceUtils.addSslOptionsToBuilder(dsConfig, ob));
    }

    @Test
    public void testAddSslOptions_missingSslConfiguration_throws() {
        DatasourceConfiguration dsConfig = standardConfig();
        dsConfig.getConnection().setSsl(null);

        ConnectionFactoryOptions.Builder ob = MySqlDatasourceUtils.getBuilder(dsConfig, emptyContext());
        assertThrows(AppsmithPluginException.class, () -> MySqlDatasourceUtils.addSslOptionsToBuilder(dsConfig, ob));
    }

    @Test
    public void testGetNewConnectionPool_returnsConfiguredPool() {
        DatasourceConfiguration dsConfig = standardConfig();

        // Building the pool does not open a connection, so this is safe without a live server.
        ConnectionPool pool = MySqlDatasourceUtils.getNewConnectionPool(dsConfig, emptyContext(), 5);

        assertNotNull(pool);
        pool.dispose();
    }
}
