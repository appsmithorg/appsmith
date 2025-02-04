package com.appsmith.external.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.UploadedFile;
import lombok.NoArgsConstructor;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.connection.channel.direct.Parameters;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;
import net.schmizz.sshj.userauth.keyprovider.KeyProvider;
import net.schmizz.sshj.userauth.keyprovider.OpenSSHKeyFile;
import net.schmizz.sshj.userauth.keyprovider.PKCS8KeyFile;
import net.schmizz.sshj.userauth.method.AuthPublickey;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;

import static com.appsmith.external.constants.ConnectionMethod.CONNECTION_METHOD_SSH;
import static com.appsmith.external.constants.PluginConstants.HostName.LOCALHOST;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_MISSING_PORT_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.SSH_CONNECTION_FAILED_ERROR_MSG;
import static java.lang.Math.toIntExact;
import static org.apache.commons.lang3.ObjectUtils.defaultIfNull;
import static org.springframework.util.CollectionUtils.isEmpty;

/**
 * This class is meant to provide methods that should help with the creation and management of SSH tunnel by
 * various plugins.
 */
@NoArgsConstructor
public class SSHUtils {
    public static final Long DEFAULT_SSH_PORT = 22L;
    static Object monitor = new Object(); // monitor object to be used for synchronization lock
    public static final int RANDOM_FREE_PORT_NUM = 0; // using port 0 indicates `bind` method to acquire random free
    // port

    /**
     * Create SSH tunnel and return the relevant connection context.
     *
     * @param sshHost : host address of remote SSH server
     * @param sshPort : port number for remote SSH server
     * @param sshUsername : login username for the remote SSH server account
     * @param key : client private key
     * @param dbHost : host address on which the DB is hosted relative to the SSH host
     * @param dbPort : port address on which the DB is hosted relative to the SSH host
     * @return
     * @throws IOException
     */
    public static SSHTunnelContext createSSHTunnel(
            String sshHost, int sshPort, String sshUsername, UploadedFile key, String dbHost, int dbPort)
            throws IOException {

        final SSHClient client = new SSHClient();

        /**
         * Usually SSH client tries to verify remote host public key with the public key available in known_hosts
         * folder. However, in our case because we cannot allow users to add trusted public keys in known_hosts
         * folder for cloud hosted instances I am turning this check off.
         */
        client.addHostKeyVerifier(new PromiscuousVerifier());

        client.connect(sshHost, sshPort);
        Reader targetReader = new InputStreamReader(new ByteArrayInputStream(key.getDecodedContent()));
        KeyProvider keyFile;
        String keyContent = new String(key.getDecodedContent(), StandardCharsets.UTF_8);

        if (keyContent.contains("BEGIN OPENSSH PRIVATE KEY")) {
            // OpenSSH format
            OpenSSHKeyFile openSSHKeyFile = new OpenSSHKeyFile();
            openSSHKeyFile.init(new StringReader(keyContent));
            keyFile = openSSHKeyFile;
        } else {
            // PEM (PKCS#8) format
            PKCS8KeyFile pkcs8KeyFile = new PKCS8KeyFile();
            pkcs8KeyFile.init(new StringReader(keyContent));
            keyFile = pkcs8KeyFile;
        }

        // Authenticate using the detected key format
        client.auth(sshUsername, new AuthPublickey(keyFile));

        final ServerSocket serverSocket = new ServerSocket();
        final Parameters params = new Parameters(LOCALHOST, RANDOM_FREE_PORT_NUM, dbHost, dbPort);

        /**
         * Quoting from the source file documentation:
         * When a TCP connection is closed the connection may remain in a timeout state for a period of time after
         * the connection is closed. It may not be possible to bind a socket to the required
         * SocketAddress if there is a connection in the timeout state involving the socket address or port.
         * Enabling SO_REUSEADDR prior to binding the socket using bind(SocketAddress) allows the socket to be bound
         * even though a previous connection is in a timeout state.
         */
        serverSocket.setReuseAddress(true);

        /**
         * This method has been synchronized via a lock because it is not documented if the `bind` method is thread
         * safe or not. In particular, this is a concern because we are acquiring a free port address via the `bind`
         * method. Hypothetically, there could be a race condition when acquiring the free port.
         */
        synchronized (monitor) {
            serverSocket.bind(new InetSocketAddress(params.getLocalHost(), params.getLocalPort()));
        }

        Runnable serverTask = new Runnable() {
            @Override
            public void run() {
                try {
                    client.newLocalPortForwarder(params, serverSocket).listen();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        };
        Thread serverThread = new Thread(serverTask);
        serverThread.start();

        return new SSHTunnelContext(serverSocket, serverThread, client);
    }

    public static boolean isSSHEnabled(
            DatasourceConfiguration datasourceConfiguration, int connectionMethodPropertiesIndex) {
        return !isEmpty(datasourceConfiguration.getProperties())
                && datasourceConfiguration.getProperties().size() > connectionMethodPropertiesIndex
                && CONNECTION_METHOD_SSH
                        .toString()
                        .equals(datasourceConfiguration
                                .getProperties()
                                .get(connectionMethodPropertiesIndex)
                                .getValue());
    }

    public static int getSSHPortFromConfigOrDefault(DatasourceConfiguration datasourceConfiguration) {
        return toIntExact(defaultIfNull(datasourceConfiguration.getSshProxy().getPort(), DEFAULT_SSH_PORT));
    }

    public static int getDBPortFromConfigOrDefault(
            DatasourceConfiguration datasourceConfiguration, Long defaultDBPort) {
        return toIntExact(
                defaultIfNull(datasourceConfiguration.getEndpoints().get(0).getPort(), defaultDBPort));
    }

    /**
     * Create a new SSH connection if configured and return the SSH connection details in the ConnectionContext object.
     * @param datasourceConfiguration : datasource configuration
     * @param connectionMethodPropertiesIndex : index in datasourceConfiguration.properties list where the SSH config
     *                                        toggle data is placed.
     */
    public static <C> ConnectionContext getConnectionContext(
            DatasourceConfiguration datasourceConfiguration,
            int connectionMethodPropertiesIndex,
            Long defaultDBPort,
            Class<C> connectionType) {

        /* Return empty ConnectionContext if SSH tunnel is not enabled */
        if (!isSSHEnabled(datasourceConfiguration, connectionMethodPropertiesIndex)) {
            return new ConnectionContext<C>(null, null);
        }

        if (datasourceConfiguration.getEndpoints().get(0).getPort() == null && defaultDBPort == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, DS_MISSING_PORT_ERROR_MSG);
        }

        String sshHost = datasourceConfiguration.getSshProxy().getHost();
        int sshPort = getSSHPortFromConfigOrDefault(datasourceConfiguration);
        String sshUsername = datasourceConfiguration.getSshProxy().getUsername();
        UploadedFile key = datasourceConfiguration.getSshProxy().getPrivateKey().getKeyFile();
        String dbHost = datasourceConfiguration.getEndpoints().get(0).getHost();
        int dbPort = getDBPortFromConfigOrDefault(datasourceConfiguration, defaultDBPort);
        SSHTunnelContext sshTunnelContext = null;
        try {
            sshTunnelContext = createSSHTunnel(sshHost, sshPort, sshUsername, key, dbHost, dbPort);
        } catch (IOException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, SSH_CONNECTION_FAILED_ERROR_MSG);
        }
        return new ConnectionContext<C>(null, sshTunnelContext);
    }

    public static Boolean isSSHTunnelConnected(SSHTunnelContext sshTunnelContext) {
        if (sshTunnelContext == null) {
            return true;
        }

        SSHClient sshClient = sshTunnelContext.getSshClient();
        return sshClient != null && sshClient.isConnected() && sshClient.isAuthenticated();
    }
}
