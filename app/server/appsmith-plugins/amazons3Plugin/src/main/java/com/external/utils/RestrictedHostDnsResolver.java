package com.external.utils;

import com.appsmith.util.RestrictedHostFilter;
import org.apache.http.conn.DnsResolver;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * The DNS resolver of the plugin's HTTP client. Every host resolves through
 * {@link RestrictedHostFilter#resolveAllIfAllowed(String)}, so a connection to a host the restricted host policy blocks
 * is refused at connect time, even when the host resolved to an allowed address when the datasource was created. The
 * operator's configured proxy host resolves without the check: the proxy comes from the server's own settings, not from
 * the datasource, and egress through it is the proxy operator's policy.
 */
final class RestrictedHostDnsResolver implements DnsResolver {

    private final String proxyHost;

    /** @param proxyHost the configured proxy host, or null when no proxy is configured */
    RestrictedHostDnsResolver(String proxyHost) {
        this.proxyHost = proxyHost;
    }

    @Override
    public InetAddress[] resolve(String host) throws UnknownHostException {
        if (proxyHost != null && proxyHost.equalsIgnoreCase(host)) {
            return InetAddress.getAllByName(host);
        }
        return RestrictedHostFilter.resolveAllIfAllowed(host);
    }
}
