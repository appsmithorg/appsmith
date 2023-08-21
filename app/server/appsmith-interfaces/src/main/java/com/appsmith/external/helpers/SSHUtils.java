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

@NoArgsConstructor
public class SSHUtils {
    static Object monitor = new Object();
    public static final int RANDOM_FREE_PORT_NUM = 0;

    // TODO: add comments
    public static SSHTunnelContext createSSHTunnel(String sshHost, int sshPort, String username, String key,
                                                   String dbHost, int dbPort) throws IOException {
        final SSHClient client = new SSHClient();

        client.loadKnownHosts();
        client.connect(sshHost, sshPort);
        PKCS8KeyFile keyFile = new PKCS8KeyFile();
        keyFile.init(key, null);
        client.auth(username, new AuthPublickey(keyFile));

        final ServerSocket serverSocket = new ServerSocket();
        final Parameters params = new Parameters(LOCALHOST, RANDOM_FREE_PORT_NUM, dbHost, dbPort);
        serverSocket.setReuseAddress(true);
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