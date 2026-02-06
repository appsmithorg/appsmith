package com.appsmith.git.helpers;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.transport.SshSessionFactory;
import org.eclipse.jgit.transport.SshTransport;
import org.eclipse.jgit.transport.Transport;

/**
 * A custom TransportConfigCallback class that loads private key and public key from the provided strings.
 *
 * <p><b>Usage:</b> Use the static factory methods to create instances:
 * <ul>
 *   <li>{@link #withNoProxy(String, String)} - Direct SSH connection, bypasses all proxies.
 *       Use when client has SSH port 22 open.</li>
 *   <li>{@link #withSystemProxy(String, String)} - Uses system/environment proxy settings.
 *       Use when SSH port is blocked and connections must go through proxy (e.g., HTTPS port).</li>
 * </ul>
 *
 * <p><b>Example:</b>
 * <pre>
 * // For direct SSH (no proxy):
 * TransportConfigCallback callback = SshTransportConfigCallback.withNoProxy(privateKey, publicKey);
 *
 * // For SSH through system proxy:
 * TransportConfigCallback callback = SshTransportConfigCallback.withSystemProxy(privateKey, publicKey);
 *
 * Git.open(gitRepoDirFile)
 *    .push()
 *    .setTransportConfigCallback(callback)
 *    .call();
 * </pre>
 *
 * <p>Following Google's Effective Java Item 1: "Consider static factory methods instead of constructors"
 */
@Slf4j
public class SshTransportConfigCallback implements TransportConfigCallback {

    private final SshSessionFactory sshSessionFactory;
    private final boolean proxyEnabled;

    // ==================== Static Factory Methods ====================

    /**
     * Creates a TransportConfigCallback based on the proxy disabled configuration.
     * This is the preferred factory method when reading from GitConfig.
     *
     * @param privateKey       The SSH private key
     * @param publicKey        The SSH public key
     * @param isSshProxyDisabled If true, proxy is DISABLED (direct SSH). If false, proxy is ENABLED (system proxy).
     * @return A new callback instance with appropriate proxy configuration
     */
    public static SshTransportConfigCallback create(String privateKey, String publicKey, boolean isSshProxyDisabled) {
        if (isSshProxyDisabled) {
            return withNoProxy(privateKey, publicKey);
        } else {
            return withSystemProxy(privateKey, publicKey);
        }
    }

    /**
     * Creates a TransportConfigCallback with proxy DISABLED.
     * Use this when the client has direct SSH access (port 22 open).
     *
     * @param privateKey The SSH private key
     * @param publicKey  The SSH public key
     * @return A new callback instance with proxy disabled
     */
    public static SshTransportConfigCallback withNoProxy(String privateKey, String publicKey) {
        return new SshTransportConfigCallback(privateKey, publicKey, false);
    }

    /**
     * Creates a TransportConfigCallback with system/environment proxy ENABLED.
     * Use this when SSH port is blocked and connections must go through proxy.
     *
     * @param privateKey The SSH private key
     * @param publicKey  The SSH public key
     * @return A new callback instance using system proxy settings
     */
    public static SshTransportConfigCallback withSystemProxy(String privateKey, String publicKey) {
        return new SshTransportConfigCallback(privateKey, publicKey, true);
    }

    // ==================== Constructors ====================

    /**
     * Creates a TransportConfigCallback with proxy ENABLED (backward compatible default).
     * This constructor is kept for backward compatibility with existing callers.
     *
     * <p>For explicit proxy control, prefer using the static factory methods:
     * <ul>
     *   <li>{@link #create(String, String, boolean)} - Based on config value</li>
     *   <li>{@link #withNoProxy(String, String)} - Explicitly disable proxy</li>
     *   <li>{@link #withSystemProxy(String, String)} - Use system proxy settings</li>
     * </ul>
     *
     * @param privateKey The SSH private key
     * @param publicKey  The SSH public key
     */
    public SshTransportConfigCallback(String privateKey, String publicKey) {
        this(privateKey, publicKey, true); // Default: proxy enabled (backward compatible)
    }

    /**
     * Internal constructor with proxy configuration.
     *
     * @param privateKey   The SSH private key
     * @param publicKey    The SSH public key
     * @param useProxy     Whether to use system proxy (true) or disable proxy (false)
     */
    private SshTransportConfigCallback(String privateKey, String publicKey, boolean useProxy) {
        this.proxyEnabled = useProxy;

        // Create the SSH session factory based on proxy preference
        if (useProxy) {
            this.sshSessionFactory = AppsmithSshdSessionFactory.withSystemProxy(privateKey, publicKey);
        } else {
            this.sshSessionFactory = AppsmithSshdSessionFactory.withNoProxy(privateKey, publicKey);
        }

        log.debug("SSH transport configured: proxyEnabled={}", proxyEnabled);
    }

    // ==================== TransportConfigCallback Implementation ====================

    @Override
    public void configure(Transport transport) {
        log.debug("Configuring SSH transport for URI: {}, proxyEnabled: {}", transport.getURI(), proxyEnabled);

        SshTransport sshTransport = (SshTransport) transport;
        sshTransport.setSshSessionFactory(sshSessionFactory);
    }
}
