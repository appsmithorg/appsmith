package com.external.plugins;

import org.junit.jupiter.api.Test;

import javax.net.ssl.SSLParameters;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Unit tests for the security-critical TLS configuration in {@link RestrictedHostJedisSocketFactory}.
 * These don't open sockets or complete a TLS handshake — RFC 2818 hostname verification is JDK
 * behavior we trust — they verify that our code sets up the JDK to enforce it. See
 * GHSA-qhfj-g87x-m39w discussion for context.
 */
public class RestrictedHostJedisSocketFactoryTest {

    @Test
    public void enforceEndpointIdentification_setsHttpsWhenAlgorithmUnset() {
        // Default SSLParameters have no algorithm; without our override a MITM presenting any
        // CA-trusted-but-mismatched cert on the pinned IP would be accepted by Jedis 5.2.0.
        SSLParameters params = new SSLParameters();
        assertNull(params.getEndpointIdentificationAlgorithm(), "sanity: default is null");

        RestrictedHostJedisSocketFactory.enforceEndpointIdentification(params);

        assertEquals("HTTPS", params.getEndpointIdentificationAlgorithm());
    }

    @Test
    public void enforceEndpointIdentification_setsHttpsWhenAlgorithmIsEmptyString() {
        // Some caller-supplied SSLParameters start with an empty-string algorithm rather than
        // null. Treat both as "unset" and default to HTTPS.
        SSLParameters params = new SSLParameters();
        params.setEndpointIdentificationAlgorithm("");

        RestrictedHostJedisSocketFactory.enforceEndpointIdentification(params);

        assertEquals("HTTPS", params.getEndpointIdentificationAlgorithm());
    }

    @Test
    public void enforceEndpointIdentification_respectsCallerSetAlgorithm() {
        // If a caller has deliberately picked a different algorithm (e.g. "LDAPS" for LDAP-over-
        // TLS semantics, or a future custom value), our job is to close the "no verification at
        // all" gap — not to override an active policy choice.
        SSLParameters params = new SSLParameters();
        params.setEndpointIdentificationAlgorithm("LDAPS");

        RestrictedHostJedisSocketFactory.enforceEndpointIdentification(params);

        assertEquals("LDAPS", params.getEndpointIdentificationAlgorithm());
    }
}
