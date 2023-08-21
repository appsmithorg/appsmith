package com.appsmith.external.helpers;

import lombok.NoArgsConstructor;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.connection.channel.direct.Parameters;
import net.schmizz.sshj.userauth.keyprovider.PKCS8KeyFile;
import net.schmizz.sshj.userauth.method.AuthPublickey;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;

import static com.appsmith.external.constants.PluginConstants.HostName.LOCALHOST;

/**
 * This class is meant to provide methods that should help with the creation and management of SSH tunnel by
 * various plugins.
 */
@NoArgsConstructor
public class SSHUtils {
    static Object monitor = new Object(); // monitor object to be used for synchronization lock
    public static final int RANDOM_FREE_PORT_NUM = 0; // using port 0 indicates `bind` method to acquire random free
    // port

    /**
     * Create SSH tunnel and return the relevant connection context.
     *
     * @param sshHost : host address of remote SSH server
     * @param sshPort : port number for remote SSH server
     * @param username : login username for the remote SSH server account
     * @param key : client private key
     * @param dbHost : host address on which the DB is hosted relative to the SSH host
     * @param dbPort : port address on which the DB is hosted relative to the SSH host
     * @return
     * @throws IOException
     */
    public static SSHTunnelContext createSSHTunnel(String sshHost, int sshPort, String username, String key,
                                                   String dbHost, int dbPort) throws IOException {
        final SSHClient client = new SSHClient();

        client.connect(sshHost, sshPort);
        PKCS8KeyFile keyFile = new PKCS8KeyFile();
        keyFile.init(key, null);
        client.auth(username, new AuthPublickey(keyFile));

        final ServerSocket serverSocket = new ServerSocket();
        final Parameters params = new Parameters(LOCALHOST, RANDOM_FREE_PORT_NUM, dbHost, dbPort);
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
}