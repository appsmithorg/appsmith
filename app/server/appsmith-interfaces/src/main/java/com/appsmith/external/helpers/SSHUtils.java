package com.appsmith.external.helpers;

import lombok.NoArgsConstructor;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.connection.channel.direct.Parameters;
import net.schmizz.sshj.userauth.keyprovider.PKCS8KeyFile;
import net.schmizz.sshj.userauth.method.AuthPublickey;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;

@NoArgsConstructor
public class SSHUtils {
    public static ServerSocket createSSHTunnel() throws IOException {

        final SSHClient client = new SSHClient();

        client.loadKnownHosts();
        client.connect("3.108.238.235", 22);
        PKCS8KeyFile keyFile = new PKCS8KeyFile();
        keyFile.init(new File("/Users/sumitsum/Downloads/test-snippet.pem"));
        client.auth("ubuntu", new AuthPublickey(keyFile));

        final ServerSocket ss = new ServerSocket();
        final Parameters params = new Parameters("localhost", 0, "localhost", 3306);
        ss.setReuseAddress(true);
        ss.bind(new InetSocketAddress(params.getLocalHost(), params.getLocalPort()));
        //client.newLocalPortForwarder(params, ss).listen();

        Runnable serverTask = new Runnable() {
            @Override
            public void run() {
                try {
                    client.newLocalPortForwarder(params, ss).listen();
                } catch (IOException e) {
                    System.err.println("========== xxx ===========");
                    e.printStackTrace();
                }
            }
        };
        Thread serverThread = new Thread(serverTask);
        serverThread.start();

        return ss;
    }
}
