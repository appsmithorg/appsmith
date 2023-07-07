package com.appsmith.external.helpers;

import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.connection.channel.direct.Parameters;
import net.schmizz.sshj.userauth.keyprovider.PKCS8KeyFile;
import net.schmizz.sshj.userauth.method.AuthPublickey;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;

public class Test {
    public static void main(String[] args) throws IOException {
        final SSHClient client = new SSHClient();

        client.loadKnownHosts();
        client.connect("3.108.238.235", 22);
        PKCS8KeyFile keyFile = new PKCS8KeyFile();
        keyFile.init(new File("/Users/sumitsum/Downloads/test-snippet.pem"));
        client.auth("ubuntu", new AuthPublickey(keyFile));

        final Parameters params = new Parameters("localhost", 55384, "localhost", 3306);
        final ServerSocket ss = new ServerSocket();
        ss.setReuseAddress(true);
        ss.bind(new InetSocketAddress(params.getLocalHost(), params.getLocalPort()));
        client.newLocalPortForwarder(params, ss).listen();
    }
}
