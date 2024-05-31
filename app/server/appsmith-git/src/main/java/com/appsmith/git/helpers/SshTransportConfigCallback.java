package com.appsmith.git.helpers;

import com.appsmith.external.git.utils.CryptoUtil;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.crypto.util.OpenSSHPublicKeyUtil;
import org.bouncycastle.jcajce.spec.OpenSSHPrivateKeySpec;
import org.bouncycastle.jcajce.spec.OpenSSHPublicKeySpec;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.io.pem.PemReader;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.transport.CredentialsProvider;
import org.eclipse.jgit.transport.SshSessionFactory;
import org.eclipse.jgit.transport.SshTransport;
import org.eclipse.jgit.transport.Transport;
import org.eclipse.jgit.transport.sshd.ServerKeyDatabase;
import org.eclipse.jgit.transport.sshd.SshdSessionFactory;

import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.EncodedKeySpec;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.List;

import static com.appsmith.external.git.constants.SSHConstants.ECDSA_KEY_FACTORY_IDENTIFIER_BC;
import static com.appsmith.external.git.constants.SSHConstants.RSA_KEY_FACTORY_IDENTIFIER;
import static com.appsmith.external.git.constants.SSHConstants.RSA_TYPE;

/**
 * A custom TransportConfigCallback class that loads private key and public key from the provided strings in constructor.
 * An instance of this class will be used as follows:
 * <p>
 * TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(PVT_KEY_STRING, PUB_KEY_STRING);
 * Git.open(gitRepoDirFile) // gitRepoDirFile is an instance of File
 * .push()
 * .setTransportConfigCallback(transportConfigCallback)
 * .call();
 */
@Slf4j
public class SshTransportConfigCallback implements TransportConfigCallback {
    private String privateKey;
    private String publicKey;

    public SshTransportConfigCallback(String privateKey, String publicKey) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    private final SshSessionFactory sshSessionFactory = new SshdSessionFactory() {

        @Override
        protected ServerKeyDatabase getServerKeyDatabase(File homeDir, File sshDir) {
            return new ServerKeyDatabase() {
                @Override
                public List<PublicKey> lookup(
                        String connectAddress, InetSocketAddress remoteAddress, Configuration config) {
                    return List.of();
                }

                @Override
                public boolean accept(
                        String connectAddress,
                        InetSocketAddress remoteAddress,
                        PublicKey serverKey,
                        Configuration config,
                        CredentialsProvider provider) {
                    return true;
                }
            };
        }

        @Override
        protected Iterable<KeyPair> getDefaultKeys(File sshDir) {

            try {
                KeyPair keyPair;
                KeyFactory keyFactory;
                PublicKey generatedPublicKey;

                if (publicKey.startsWith(RSA_TYPE)) {
                    keyFactory = KeyFactory.getInstance(RSA_KEY_FACTORY_IDENTIFIER, new BouncyCastleProvider());

                    generatedPublicKey = keyFactory.generatePublic(CryptoUtil.decodeOpenSSHRSA(publicKey.getBytes()));

                } else {
                    keyFactory = KeyFactory.getInstance(ECDSA_KEY_FACTORY_IDENTIFIER_BC, new BouncyCastleProvider());
                    String[] fields = publicKey.split(" ");
                    AsymmetricKeyParameter keyParameter = OpenSSHPublicKeyUtil.parsePublicKey(
                            Base64.getDecoder().decode(fields[1].getBytes()));
                    OpenSSHPublicKeySpec keySpec =
                            new OpenSSHPublicKeySpec(OpenSSHPublicKeyUtil.encodePublicKey(keyParameter));

                    generatedPublicKey = keyFactory.generatePublic(keySpec);
                }

                EncodedKeySpec privateKeySpec;
                String[] splitKeys = privateKey.split("-----.*-----\n");
                if (splitKeys.length > 1) {
                    byte[] content = new PemReader(new StringReader(privateKey))
                            .readPemObject()
                            .getContent();
                    privateKeySpec = new OpenSSHPrivateKeySpec(content);
                } else {
                    privateKeySpec = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateKey));
                }

                PrivateKey generatedPrivateKey = keyFactory.generatePrivate(privateKeySpec);

                keyPair = new KeyPair(generatedPublicKey, generatedPrivateKey);
                return List.of(keyPair);
            } catch (NoSuchAlgorithmException | InvalidKeySpecException | IOException e) {
                log.debug("Error while associating keys for signing: ", e);
                throw new RuntimeException(e);
            }
        }
    };

    @Override
    public void configure(Transport transport) {
        SshTransport sshTransport = (SshTransport) transport;
        sshTransport.setSshSessionFactory(sshSessionFactory);
    }
}
