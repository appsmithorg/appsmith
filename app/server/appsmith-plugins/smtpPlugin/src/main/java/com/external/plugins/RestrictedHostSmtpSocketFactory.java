package com.external.plugins;

import com.appsmith.util.RestrictedHostFilter;
import lombok.extern.slf4j.Slf4j;

import javax.net.SocketFactory;
import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.net.UnknownHostException;

/**
 * A {@link SocketFactory} for the SMTP plugin's JavaMail session that enforces Appsmith's restricted
 * host policy at the moment each socket connects, with a SINGLE DNS resolution shared between the
 * policy check and the TCP connect.
 *
 * <p>The plugin pre-checks the host in {@code datasourceCreate} via
 * {@link RestrictedHostFilter#isHostBlocked(String)}, but JavaMail resolves {@code mail.smtp.host}
 * again every time it opens a transport, and the {@code Session} it is configured on lives in the
 * datasource context cache for a long time. Those separate resolutions are a DNS-rebinding window.
 * Installed as {@code mail.smtp.socketFactory} (with {@code mail.smtp.socketFactory.fallback=false}),
 * this factory hands JavaMail an unconnected socket whose {@code connect} resolves the configured
 * hostname once, validates every resolved address via
 * {@link RestrictedHostFilter#firstAllowedResolvedAddress(String, InetAddress[])}, and connects to
 * the returned address. The endpoint JavaMail passes to {@code connect} contributes only the port.
 *
 * <p>{@code mail.smtp.host} keeps the configured hostname, so STARTTLS, SNI and server-identity
 * checks still run against the name the user configured: Angus Mail layers TLS over the connected
 * plain socket after this factory has done its work.
 */
@Slf4j
final class RestrictedHostSmtpSocketFactory extends SocketFactory {

    private final String configuredHost;

    RestrictedHostSmtpSocketFactory(String configuredHost) {
        this.configuredHost = configuredHost;
    }

    @Override
    public Socket createSocket() {
        return new RestrictedHostSocket();
    }

    @Override
    public Socket createSocket(String host, int port) throws IOException {
        return connect(port, null, 0);
    }

    @Override
    public Socket createSocket(String host, int port, InetAddress localHost, int localPort) throws IOException {
        return connect(port, localHost, localPort);
    }

    @Override
    public Socket createSocket(InetAddress host, int port) throws IOException {
        return connect(port, null, 0);
    }

    @Override
    public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort)
            throws IOException {
        return connect(port, localAddress, localPort);
    }

    private Socket connect(int port, InetAddress localAddress, int localPort) throws IOException {
        Socket socket = createSocket();
        try {
            if (localAddress != null) {
                socket.bind(new InetSocketAddress(localAddress, localPort));
            }
            // Unresolved on purpose: RestrictedHostSocket#connect performs the one resolution.
            socket.connect(InetSocketAddress.createUnresolved(configuredHost, port));
            return socket;
        } catch (IOException e) {
            socket.close();
            throw e;
        }
    }

    /**
     * Resolves the configured host once at connect time, validates the result, and connects to the
     * validated address. The endpoint it is handed supplies only the port.
     */
    private final class RestrictedHostSocket extends Socket {

        @Override
        public void connect(SocketAddress endpoint) throws IOException {
            connect(endpoint, 0);
        }

        @Override
        public void connect(SocketAddress endpoint, int timeout) throws IOException {
            if (!(endpoint instanceof InetSocketAddress inetEndpoint)) {
                throw new IOException("Unsupported SMTP endpoint type");
            }
            // SINGLE resolution. A genuine resolution failure surfaces as the usual connect error
            // (UnknownHostException from the lookup); only a resolved-but-blocked host is a policy
            // rejection.
            final InetAddress[] resolved = InetAddress.getAllByName(configuredHost);
            final InetAddress allowed = RestrictedHostFilter.firstAllowedResolvedAddress(configuredHost, resolved)
                    .orElseThrow(() -> {
                        log.warn(
                                "Refusing SMTP connection: host '{}' is disallowed by the SSRF filter.",
                                configuredHost);
                        return new UnknownHostException(RestrictedHostFilter.HOST_NOT_ALLOWED);
                    });
            super.connect(new InetSocketAddress(allowed, inetEndpoint.getPort()), timeout);
        }
    }
}
