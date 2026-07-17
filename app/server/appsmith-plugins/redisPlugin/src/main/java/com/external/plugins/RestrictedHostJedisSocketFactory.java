package com.external.plugins;

import com.appsmith.util.RestrictedHostFilter;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Arrays;

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
 * hostname is handed to the {@link SSLSocketFactory}, so SNI and certificate verification run
 * against the hostname the user configured, not the IP. Unlike stock Jedis 5.2.0 — which leaves
 * hostname verification off by default — this factory enforces it by setting the endpoint
 * identification algorithm to {@code HTTPS}, so a CA-trusted-but-mismatched cert on the pinned IP
 * is rejected. The connect and TLS handshake logic otherwise mirrors {@code DefaultJedisSocketFactory}
 * (socket options, {@link SSLSocketWrapper}); the deviations are the single-resolution SSRF check
 * in place of the stock {@code InetAddress.getAllByName(...)} + connect, and the enforced
 * endpoint identification.
 */
@Slf4j
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

        // Gate: firstAllowedRedisAddress returns present only when EVERY resolved address passed the
        // filter, so a present result means all of `resolved` are safe to connect to. The driver
        // never re-resolves, so a rebinding resolver cannot swap in a different (internal) IP.
        if (RestrictedHostFilter.firstAllowedRedisAddress(host, resolved).isEmpty()) {
            // Connection-time SSRF rejection (incl. the DNS-rebinding case where the resolved
            // address differs from the create-time pre-check). Log it — this is the only place the
            // block is observable server-side, since the pre-check rejection happens elsewhere.
            log.warn(
                    "Refusing Redis connection: host '{}' resolved to a disallowed address [{}].",
                    host,
                    String.join(
                            ", ",
                            Arrays.stream(resolved)
                                    .map(InetAddress::getHostAddress)
                                    .toList()));
            throw new JedisConnectionException(RestrictedHostFilter.HOST_NOT_ALLOWED);
        }

        Socket socket = null;
        try {
            // Connect to the first reachable validated address. Trying all of them (not just the
            // first) means a dual-stack host whose leading record is an unreachable IPv6 still falls
            // back to its IPv4, matching DefaultJedisSocketFactory. Every candidate was validated
            // above, so the failover does not widen the SSRF surface. No second DNS lookup happens.
            socket = connectToFirstReachable(resolved);
            socket.setSoTimeout(socketTimeout);

            if (ssl) {
                SSLSocketFactory factory =
                        sslSocketFactory != null ? sslSocketFactory : (SSLSocketFactory) SSLSocketFactory.getDefault();
                final Socket plainSocket = socket;
                // Hand the original hostname (not the pinned IP) to the TLS layer so SNI and
                // certificate hostname verification run against the configured hostname.
                socket = factory.createSocket(plainSocket, host, port, true);

                final SSLSocket sslSocket = (SSLSocket) socket;
                // Enforce TLS certificate hostname verification (RFC 2818): the cert's SAN/CN must
                // match the configured hostname. Jedis 5.2.0 leaves this off by default, which would
                // let a MITM present any CA-trusted-but-mismatched cert on the pinned IP. Verification
                // runs against `host` (passed to createSocket above), not the IP we connected to.
                final SSLParameters params = sslParameters != null ? sslParameters : sslSocket.getSSLParameters();
                enforceEndpointIdentification(params);
                sslSocket.setSSLParameters(params);

                socket = new SSLSocketWrapper(sslSocket, plainSocket);
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

    /**
     * Default the SSL endpoint identification algorithm to {@code "HTTPS"} (the JDK's registered
     * name for RFC 2818 hostname verification — cert SAN/CN must match the hostname the client
     * asked to connect to) unless a caller has deliberately set an algorithm. Package-private so
     * unit tests can exercise the security-critical branch without opening a socket.
     */
    static void enforceEndpointIdentification(SSLParameters params) {
        final String algo = params.getEndpointIdentificationAlgorithm();
        if (algo == null || algo.isEmpty()) {
            params.setEndpointIdentificationAlgorithm("HTTPS");
        }
    }

    /**
     * Opens a plain TCP socket to the first reachable address, trying each in order (mirrors
     * {@code DefaultJedisSocketFactory#connectToFirstSuccessfulHost}). All addresses passed here
     * have already cleared the SSRF filter, so iterating only adds connection resilience — e.g. a
     * dual-stack host whose first record is an unreachable IPv6 still connects via its IPv4. Throws
     * once every candidate has failed, with each failure attached as a suppressed exception.
     */
    private Socket connectToFirstReachable(InetAddress[] addresses) throws JedisConnectionException {
        JedisConnectionException failure = null;
        for (InetAddress address : addresses) {
            Socket candidate = null;
            try {
                candidate = new Socket();
                // Socket options mirror DefaultJedisSocketFactory.
                candidate.setReuseAddress(true);
                candidate.setKeepAlive(true);
                candidate.setTcpNoDelay(true);
                candidate.setSoLinger(true, 0);
                candidate.connect(new InetSocketAddress(address, port), connectionTimeout);
                return candidate;
            } catch (Exception e) {
                closeQuietly(candidate);
                if (failure == null) {
                    failure = new JedisConnectionException("Failed to connect to Redis host '" + host + "'.");
                }
                failure.addSuppressed(e);
            }
        }
        throw failure != null
                ? failure
                : new JedisConnectionException("Failed to connect to Redis host '" + host + "'.");
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
