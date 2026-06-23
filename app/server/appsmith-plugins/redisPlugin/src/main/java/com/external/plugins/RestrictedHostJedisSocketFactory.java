package com.external.plugins;

import com.appsmith.util.RestrictedHostFilter;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisClientConfig;
import redis.clients.jedis.JedisSocketFactory;
import redis.clients.jedis.SSLSocketWrapper;
import redis.clients.jedis.exceptions.JedisConnectionException;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.Optional;

/**
 * A Jedis {@link JedisSocketFactory} that enforces Appsmith's SSRF host policy at the exact
 * moment the socket is opened, using a SINGLE DNS resolution shared between the policy check and
 * the TCP connect.
 *
 * <p>Background (GHSA-qhfj-g87x-m39w): the Redis plugin pre-checks the host in
 * {@code datasourceCreate} via {@link RestrictedHostFilter#isHostBlocked(String)}, but the stock
 * {@link redis.clients.jedis.DefaultJedisSocketFactory} resolves the hostname again when it opens
 * the pool's first socket. Those two independent resolutions are a DNS-rebinding TOCTOU window: a
 * hostile resolver can return an allowed IP to the pre-check and the internal Redis IP to the
 * driver. This factory closes the window by resolving once, validating the resolved addresses via
 * {@link RestrictedHostFilter#firstAllowedRedisAddress(String, InetAddress[])}, and connecting the
 * socket directly to the returned {@link InetAddress} — the driver never re-resolves the hostname.
 *
 * <p>For TLS ({@code rediss://}) the plaintext socket connects to the pinned IP, but the original
 * hostname is handed to the {@link SSLSocketFactory} and hostname verifier, so SNI and certificate
 * verification run against the hostname the user configured, not the IP. The connect and TLS
 * handshake logic mirrors {@code DefaultJedisSocketFactory} (socket options, {@link
 * SSLSocketWrapper}) to avoid behavioral drift; the only deviation is the single-resolution
 * SSRF check in place of the stock {@code InetAddress.getAllByName(...)} + connect.
 */
public class RestrictedHostJedisSocketFactory implements JedisSocketFactory {

    private final String host;
    private final int port;
    private final int connectionTimeout;
    private final int socketTimeout;
    private final boolean ssl;
    private final SSLSocketFactory sslSocketFactory;
    private final SSLParameters sslParameters;
    private final HostnameVerifier hostnameVerifier;

    public RestrictedHostJedisSocketFactory(HostAndPort hostAndPort, JedisClientConfig config) {
        this.host = hostAndPort.getHost();
        this.port = hostAndPort.getPort();
        this.connectionTimeout = config.getConnectionTimeoutMillis();
        this.socketTimeout = config.getSocketTimeoutMillis();
        this.ssl = config.isSsl();
        this.sslSocketFactory = config.getSslSocketFactory();
        this.sslParameters = config.getSslParameters();
        this.hostnameVerifier = config.getHostnameVerifier();
    }

    @Override
    public Socket createSocket() throws JedisConnectionException {
        // SINGLE resolution. A genuine resolution failure surfaces as a connection error (clearer
        // than "Host not allowed."); only a resolved-but-blocked host is a policy rejection.
        final InetAddress[] resolved;
        try {
            resolved = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new JedisConnectionException("Failed to resolve Redis host '" + host + "'.", e);
        }

        // Validate the addresses we just resolved and connect to one of them — the driver never
        // re-resolves, so a rebinding resolver cannot swap in a different (internal) IP.
        final Optional<InetAddress> pinned = RestrictedHostFilter.firstAllowedRedisAddress(host, resolved);
        if (!pinned.isPresent()) {
            throw new JedisConnectionException(RestrictedHostFilter.HOST_NOT_ALLOWED);
        }
        final InetAddress pinnedAddress = pinned.get();

        Socket socket = null;
        try {
            socket = new Socket();
            // Socket options mirror DefaultJedisSocketFactory.
            socket.setReuseAddress(true);
            socket.setKeepAlive(true);
            socket.setTcpNoDelay(true);
            socket.setSoLinger(true, 0);

            // Connect to the validated IP literal — no second DNS lookup happens here.
            socket.connect(new InetSocketAddress(pinnedAddress, port), connectionTimeout);
            socket.setSoTimeout(socketTimeout);

            if (ssl) {
                SSLSocketFactory factory =
                        sslSocketFactory != null ? sslSocketFactory : (SSLSocketFactory) SSLSocketFactory.getDefault();
                final Socket plainSocket = socket;
                // Hand the original hostname (not the pinned IP) to the TLS layer so SNI and
                // certificate hostname verification run against the configured hostname.
                socket = factory.createSocket(plainSocket, host, port, true);
                if (sslParameters != null) {
                    ((SSLSocket) socket).setSSLParameters(sslParameters);
                }
                socket = new SSLSocketWrapper((SSLSocket) socket, plainSocket);
                if (hostnameVerifier != null && !hostnameVerifier.verify(host, ((SSLSocket) socket).getSession())) {
                    throw new JedisConnectionException(
                            String.format("The connection to '%s' failed ssl/tls hostname verification.", host));
                }
            }

            return socket;
        } catch (JedisConnectionException e) {
            closeQuietly(socket);
            throw e;
        } catch (Exception e) {
            closeQuietly(socket);
            throw new JedisConnectionException("Failed to create socket.", e);
        }
    }

    private static void closeQuietly(Socket socket) {
        if (socket != null) {
            try {
                socket.close();
            } catch (Exception ignored) {
                // Best-effort cleanup on a failed connect; nothing actionable here.
            }
        }
    }
}
