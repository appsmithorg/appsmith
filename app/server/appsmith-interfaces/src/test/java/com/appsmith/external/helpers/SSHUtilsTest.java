package com.appsmith.external.helpers;

import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSHConnection;
import net.schmizz.sshj.SSHClient;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static com.appsmith.external.helpers.SSHUtils.getConnectionContext;
import static com.appsmith.external.helpers.SSHUtils.getDBPortFromConfigOrDefault;
import static com.appsmith.external.helpers.SSHUtils.getSSHPortFromConfigOrDefault;
import static com.appsmith.external.helpers.SSHUtils.isSSHEnabled;
import static com.appsmith.external.helpers.SSHUtils.isSSHTunnelConnected;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class SSHUtilsTest {
    /* Test is ssh enabled method */
    @Test
    public void testIsSSHEnabled_trueCase() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "SSH"));
        datasourceConfiguration.setProperties(properties);
        assertTrue(
                isSSHEnabled(datasourceConfiguration, 1),
                datasourceConfiguration.getProperties().toString());
    }

    /* Test is ssh disabled method */
    @Test
    public void testIsSSHEnabled_falseCase() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "Standard"));
        datasourceConfiguration.setProperties(properties);
        assertFalse(
                isSSHEnabled(datasourceConfiguration, 1),
                datasourceConfiguration.getProperties().toString());
    }

    /* Test is ssh connected when all objects return expected values */
    @Test
    public void testIsSSHConnected_withAllTruthyValues() {
        SSHClient mockSSHClient = mock(SSHClient.class);
        when(mockSSHClient.isConnected()).thenReturn(true);
        when(mockSSHClient.isAuthenticated()).thenReturn(true);
        SSHTunnelContext sshTunnelContext = new SSHTunnelContext(null, null, mockSSHClient);
        assertTrue(isSSHTunnelConnected(sshTunnelContext));
    }

    /* Test is ssh connected when authentication has failed */
    @Test
    public void testIsSSHConnected_withAuthFailure() {
        SSHClient mockSSHClient = mock(SSHClient.class);
        when(mockSSHClient.isConnected()).thenReturn(true);
        when(mockSSHClient.isAuthenticated()).thenReturn(false);
        SSHTunnelContext sshTunnelContext = new SSHTunnelContext(null, null, mockSSHClient);
        assertFalse(isSSHTunnelConnected(sshTunnelContext));
    }

    /* Test is ssh connected when connection has failed */
    @Test
    public void testIsSSHConnected_withConnectionFailure() {
        SSHClient mockSSHClient = mock(SSHClient.class);
        when(mockSSHClient.isConnected()).thenReturn(false);
        when(mockSSHClient.isAuthenticated()).thenReturn(true);
        SSHTunnelContext sshTunnelContext = new SSHTunnelContext(null, null, mockSSHClient);
        assertFalse(isSSHTunnelConnected(sshTunnelContext));
    }

    /* Test is ssh connected when ssh client is null */
    @Test
    public void testIsSSHConnected_whenSSHClientIsNull() {
        SSHTunnelContext sshTunnelContext = new SSHTunnelContext(null, null, null);
        assertFalse(isSSHTunnelConnected(sshTunnelContext));
    }

    /* Test get connection context */
    @Test
    public void testGetConnectionContext_whenSSHIsDisabled() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        /* Set connection method toggle to non-SSH value e.g. Standard */
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "Standard"));
        datasourceConfiguration.setProperties(properties);

        ConnectionContext connectionContext = getConnectionContext(datasourceConfiguration, 1, null, Object.class);
        assertTrue(connectionContext.getConnection() == null, connectionContext.toString());
        assertTrue(connectionContext.getSshTunnelContext() == null, connectionContext.toString());
    }

    @Test
    public void testDefaultSSHPortValue() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setSshProxy(new SSHConnection()); // port number not provided

        assertEquals(getSSHPortFromConfigOrDefault(datasourceConfiguration), 22L);
    }

    @Test
    public void testDefaultDBPortValue() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(List.of(new Endpoint()));

        assertEquals(getDBPortFromConfigOrDefault(datasourceConfiguration, 1234L), 1234L);
    }
}
