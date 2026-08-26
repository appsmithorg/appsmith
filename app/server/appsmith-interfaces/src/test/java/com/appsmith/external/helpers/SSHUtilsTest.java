package com.appsmith.external.helpers;

import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSHConnection;
import com.appsmith.external.models.UploadedFile;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.userauth.keyprovider.OpenSSHKeyFile;
import net.schmizz.sshj.userauth.keyprovider.PKCS8KeyFile;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.security.Security;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.external.helpers.SSHUtils.getConnectionContext;
import static com.appsmith.external.helpers.SSHUtils.getDBPortFromConfigOrDefault;
import static com.appsmith.external.helpers.SSHUtils.getSSHPortFromConfigOrDefault;
import static com.appsmith.external.helpers.SSHUtils.isSSHEnabled;
import static com.appsmith.external.helpers.SSHUtils.isSSHTunnelConnected;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class SSHUtilsTest {

    @BeforeAll
    static void setup() {
        Security.addProvider(new BouncyCastleProvider()); // Ensure BouncyCastle is available for OpenSSH keys
    }

    /* Test OpenSSH Key Parsing */
    @Test
    public void testOpenSSHKeyParsing() throws Exception {
        String opensshKey = "-----BEGIN OPENSSH PRIVATE KEY-----\n"
                + "b3BlbnNzaC1rZXktdmVyc2lvbjE=\n"
                + "-----END OPENSSH PRIVATE KEY-----";

        Reader reader = new StringReader(opensshKey);
        OpenSSHKeyFile openSSHKeyFile = new OpenSSHKeyFile();
        openSSHKeyFile.init(reader);

        assertNotNull(openSSHKeyFile);
    }

    /* Test PKCS#8 PEM Key Parsing */
    @Test
    public void testPKCS8PEMKeyParsing() throws Exception {
        String pkcs8Key =
                "-----BEGIN PRIVATE KEY-----\n" + "MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n" + "-----END PRIVATE KEY-----";

        Reader reader = new StringReader(pkcs8Key);
        PKCS8KeyFile pkcs8KeyFile = new PKCS8KeyFile();
        pkcs8KeyFile.init(reader);

        assertNotNull(pkcs8KeyFile);
    }

    /* Test RSA PEM Key Parsing */
    @Test
    public void testRSAPEMKeyParsing() throws Exception {
        String rsaKey =
                "-----BEGIN RSA PRIVATE KEY-----\n" + "MIIEowIBAAKCAQEA7...\n" + "-----END RSA PRIVATE KEY-----";

        Reader reader = new StringReader(rsaKey);
        PKCS8KeyFile pkcs8KeyFile = new PKCS8KeyFile();
        pkcs8KeyFile.init(reader);

        assertNotNull(pkcs8KeyFile);
    }

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

    /**
     * An SSH endpoint that accepts the TCP connection but never sends its identification banner. Without socket
     * timeouts sshj blocks the calling thread indefinitely; with them createSSHTunnel must fail within the bound.
     * The call runs on a daemon thread so a regression shows up as a failed assertion, not a hung JVM.
     */
    @Test
    public void createSSHTunnel_againstUnresponsiveServer_failsWithinTimeout() throws Exception {
        Queue<Socket> heldConnections = new ConcurrentLinkedQueue<>();
        try (ServerSocket silentServer = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            Thread acceptor = new Thread(() -> {
                try {
                    while (!silentServer.isClosed()) {
                        heldConnections.add(silentServer.accept());
                    }
                } catch (IOException ignored) {
                    // server closed
                }
            });
            acceptor.setDaemon(true);
            acceptor.start();

            UploadedFile key = new UploadedFile();
            key.setName("unused.pem");
            key.setBase64Content("");
            AtomicReference<Throwable> failure = new AtomicReference<>();
            CountDownLatch finished = new CountDownLatch(1);
            Thread caller = new Thread(() -> {
                try {
                    SSHUtils.createSSHTunnel(
                            silentServer.getInetAddress().getHostAddress(),
                            silentServer.getLocalPort(),
                            "user",
                            key,
                            "db.internal",
                            3306,
                            2_000,
                            2_000);
                } catch (Throwable t) {
                    failure.set(t);
                } finally {
                    finished.countDown();
                }
            });
            caller.setDaemon(true);
            caller.start();

            long bound = 2_000 + 2_000 + 8_000;
            assertTrue(
                    finished.await(bound, TimeUnit.MILLISECONDS),
                    "createSSHTunnel did not return within " + bound + " ms against an unresponsive SSH server");
            assertNotNull(failure.get(), "createSSHTunnel must fail, not succeed, against an unresponsive server");
            assertTrue(
                    failure.get() instanceof IOException,
                    "expected the connection-level IOException from sshj, got: " + failure.get());
            boolean timedOut = false;
            for (Throwable cause = failure.get(); cause != null; cause = cause.getCause()) {
                if (cause instanceof SocketTimeoutException) {
                    timedOut = true;
                    break;
                }
            }
            assertTrue(timedOut, "expected a SocketTimeoutException in the cause chain, got: " + failure.get());
        } finally {
            for (Socket socket : heldConnections) {
                socket.close();
            }
        }
    }
}
