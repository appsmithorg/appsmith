package com.external.plugins;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.net.spi.InetAddressResolver;
import java.net.spi.InetAddressResolverProvider;
import java.util.Locale;
import java.util.stream.Stream;

/**
 * Resolves {@code localhost} and every {@code *.localhost} name to 127.0.0.1 (RFC 6761) and delegates all other names
 * to the JDK's resolver. Virtual-hosted S3 requests put the bucket in the host name ({@code my-bucket.localhost}), so
 * this lets them reach a {@code MockWebServer} bound to 127.0.0.1 regardless of the host's own resolver. Registered for
 * the test JVM through {@code META-INF/services/java.net.spi.InetAddressResolverProvider}.
 */
public class LoopbackSubdomainResolverProvider extends InetAddressResolverProvider {

    private static final String LOOPBACK_NAME = "localhost";

    @Override
    public InetAddressResolver get(Configuration configuration) {
        InetAddressResolver builtin = configuration.builtinResolver();
        return new InetAddressResolver() {
            @Override
            public Stream<InetAddress> lookupByName(String host, LookupPolicy lookupPolicy)
                    throws UnknownHostException {
                String name = host.toLowerCase(Locale.ROOT);
                if (name.equals(LOOPBACK_NAME) || name.endsWith("." + LOOPBACK_NAME)) {
                    return Stream.of(InetAddress.getByAddress(host, new byte[] {127, 0, 0, 1}));
                }
                return builtin.lookupByName(host, lookupPolicy);
            }

            @Override
            public String lookupByAddress(byte[] address) throws UnknownHostException {
                return builtin.lookupByAddress(address);
            }
        };
    }

    @Override
    public String name() {
        return "loopback-subdomains";
    }
}
