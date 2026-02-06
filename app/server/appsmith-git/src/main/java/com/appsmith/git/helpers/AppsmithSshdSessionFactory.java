package com.appsmith.git.helpers;

import com.appsmith.external.git.utils.CryptoUtil;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.crypto.util.OpenSSHPublicKeyUtil;
import org.bouncycastle.jcajce.spec.OpenSSHPrivateKeySpec;
import org.bouncycastle.jcajce.spec.OpenSSHPublicKeySpec;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.io.pem.PemReader;
import org.eclipse.jgit.transport.CredentialsProvider;
import org.eclipse.jgit.transport.sshd.DefaultProxyDataFactory;
import org.eclipse.jgit.transport.sshd.ProxyDataFactory;
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
 * Custom SshdSessionFactory that provides SSH key-based authentication for Git operations.
 * This class extends SshdSessionFactory to:
 * <ul>
 *   <li>Configurable proxy usage for SSH connections (can disable or use system default)</li>
 *   <li>Accept all server host keys (no known_hosts verification)</li>
 *   <li>Use provided private/public key pair for authentication</li>
 * </ul>
 *
 * <p><b>Usage:</b> Use the static factory methods to create instances:
 * <ul>
 *   <li>{@link #withNoProxy(String, String)} - Direct SSH connection, bypasses all proxies</li>
 *   <li>{@link #withSystemProxy(String, String)} - Uses system/environment proxy settings</li>
 * </ul>
 *
 * <p>Following Google's Effective Java Item 1: "Consider static factory methods instead of constructors"
 */
@Slf4j
public class AppsmithSshdSessionFactory extends SshdSessionFactory {

    private final String privateKey;
    private final String publicKey;
    private final boolean proxyEnabled;

    // ==================== Proxy Factory Constants ====================

    /**
     * A ProxyDataFactory that always returns null, effectively disabling proxy for SSH connections.
     */
    private static final ProxyDataFactory NO_OP_PROXY_FACTORY = (remoteAddress) -> {
        log.debug("Proxy disabled, returning null for address: {}", remoteAddress);
        return null;
    };

    /**
     * A ProxyDataFactory that uses the system's default proxy settings via ProxySelector.
     */
    private static final ProxyDataFactory SYSTEM_PROXY_FACTORY = createSystemProxyFactory();

    private static ProxyDataFactory createSystemProxyFactory() {
        DefaultProxyDataFactory defaultFactory = new DefaultProxyDataFactory();
        return (remoteAddress) -> {
            var proxyData = defaultFactory.get(remoteAddress);
            log.debug("Using system proxy for address: {}, proxyData: {}", remoteAddress, proxyData);
            return proxyData;
        };
    }

    // ==================== Static Factory Methods ====================

    /**
     * Creates an SshdSessionFactory with proxy DISABLED.
     * Use this when the client has direct SSH access (port 22 open).
     *
     * @param privateKey The SSH private key
     * @param publicKey  The SSH public key
     * @return A new factory instance with proxy disabled
     */
    public static AppsmithSshdSessionFactory withNoProxy(String privateKey, String publicKey) {
        log.debug("Creating SSH session factory with proxy DISABLED");
        return new AppsmithSshdSessionFactory(privateKey, publicKey, NO_OP_PROXY_FACTORY, false);
    }

    /**
     * Creates an SshdSessionFactory with system/environment proxy ENABLED.
     * Use this when SSH port is blocked and connections must go through proxy.
     *
     * <p>Uses {@link DefaultProxyDataFactory} which reads proxy settings from:
     * <ul>
     *   <li>Java system properties (http.proxyHost, https.proxyHost, socksProxyHost, etc.)</li>
     *   <li>Environment variables (HTTP_PROXY, HTTPS_PROXY, ALL_PROXY, etc.)</li>
     *   <li>System's default ProxySelector</li>
     * </ul>
     *
     * @param privateKey The SSH private key
     * @param publicKey  The SSH public key
     * @return A new factory instance using system proxy settings
     */
    public static AppsmithSshdSessionFactory withSystemProxy(String privateKey, String publicKey) {
        log.debug("Creating SSH session factory with system proxy ENABLED");
        return new AppsmithSshdSessionFactory(privateKey, publicKey, SYSTEM_PROXY_FACTORY, true);
    }

    // ==================== Constructor ====================

    /**
     * Private constructor - use static factory methods instead.
     *
     * @param privateKey   The SSH private key
     * @param publicKey    The SSH public key
     * @param proxyFactory The proxy factory (null for system default, NO_OP_PROXY_FACTORY for disabled)
     * @param proxyEnabled Whether proxy is enabled (for logging purposes)
     */
    private AppsmithSshdSessionFactory(
            String privateKey, String publicKey, ProxyDataFactory proxyFactory, boolean proxyEnabled) {
        super(null, proxyFactory);
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.proxyEnabled = proxyEnabled;

        log.debug("SSH session factory created: proxyEnabled={}", proxyEnabled);
    }

    // ==================== Overridden Methods ====================

    @Override
    protected ServerKeyDatabase getServerKeyDatabase(File homeDir, File sshDir) {
        log.debug("Getting server key database: homeDir={}, sshDir={}", homeDir, sshDir);

        return new ServerKeyDatabase() {
            @Override
            public List<PublicKey> lookup(
                    String connectAddress, InetSocketAddress remoteAddress, Configuration config) {
                log.debug("Host key lookup: connectAddress={}, remoteAddress={}", connectAddress, remoteAddress);
                return List.of();
            }

            @Override
            public boolean accept(
                    String connectAddress,
                    InetSocketAddress remoteAddress,
                    PublicKey serverKey,
                    Configuration config,
                    CredentialsProvider provider) {
                log.debug(
                        "Accepting server key: connectAddress={}, algorithm={}",
                        connectAddress,
                        serverKey != null ? serverKey.getAlgorithm() : "null");
                return true;
            }
        };
    }

    @Override
    protected Iterable<KeyPair> getDefaultKeys(File sshDir) {
        String keyType = publicKey != null && publicKey.startsWith(RSA_TYPE) ? "RSA" : "ECDSA";
        log.debug("Generating key pair: keyType={}", keyType);

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
                AsymmetricKeyParameter keyParameter =
                        OpenSSHPublicKeyUtil.parsePublicKey(Base64.getDecoder().decode(fields[1].getBytes()));
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

            log.debug(
                    "Key pair generated: publicKeyAlgorithm={}, privateKeyAlgorithm={}",
                    generatedPublicKey.getAlgorithm(),
                    generatedPrivateKey.getAlgorithm());

            return List.of(keyPair);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException | IOException e) {
            log.error("Error while associating keys for signing: ", e);
            throw new RuntimeException(e);
        }
    }
}
