package com.appsmith.git.helpers;

import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.transport.JschConfigSessionFactory;
import org.eclipse.jgit.transport.OpenSshConfig;
import org.eclipse.jgit.transport.SshSessionFactory;
import org.eclipse.jgit.transport.SshTransport;
import org.eclipse.jgit.transport.Transport;
import org.eclipse.jgit.util.FS;

/**
 * A custom TransportConfigCallback class that loads private key and public key from the provided strings in constructor.
 * An instance of this class will be used as follows:
 *
 * TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(PVT_KEY_STRING, PUB_KEY_STRING);
 * Git.open(gitRepoDirFile) // gitRepoDirFile is an instance of File
 *    .push()
 *    .setTransportConfigCallback(transportConfigCallback)
 *    .call();
 */
public class SshTransportConfigCallback implements TransportConfigCallback {
    private String privateKey;
    private String publicKey;

    public SshTransportConfigCallback(String privateKey, String publicKey) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    private final SshSessionFactory sshSessionFactory = new JschConfigSessionFactory() {
        @Override
        protected void configure(OpenSshConfig.Host hc, Session session) {
            session.setConfig("StrictHostKeyChecking", "no");
        }

        @Override
        protected JSch createDefaultJSch(FS fs) throws JSchException {
            JSch jSch = super.createDefaultJSch(fs);
            jSch.addIdentity("id_rsa", privateKey.getBytes(), publicKey.getBytes(), "".getBytes());
            return jSch;
        }
    };

    @Override
    public void configure(Transport transport) {
        SshTransport sshTransport = (SshTransport) transport;
        sshTransport.setSshSessionFactory(sshSessionFactory);
    }
}
