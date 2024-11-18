package com.external.utils;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.TlsConfiguration;
import lombok.extern.slf4j.Slf4j;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

@Slf4j
public class RedisTLSManager {

    public static JedisPool createJedisPoolWithTLS(
            JedisPoolConfig poolConfig, URI uri, int timeout, DatasourceConfiguration datasourceConfiguration)
            throws Exception {

        TlsConfiguration tlsConfiguration = datasourceConfiguration.getTlsConfiguration();
        if (tlsConfiguration == null) {
            throw new IllegalArgumentException("TLS configuration is missing");
        }
        Boolean verifyTlsCertificate = tlsConfiguration.getVerifyTlsCertificate();
        Boolean requiresClientAuth = tlsConfiguration.getRequiresClientAuth();
        if (verifyTlsCertificate == null || requiresClientAuth == null) {
            throw new IllegalArgumentException("TLS configuration flags cannot be null");
        }
        SSLContext sslContext = SSLContext.getInstance("TLS");
        KeyManagerFactory keyManagerFactory = null;
        try {
            // Handle client authentication if required, regardless of certificate verification
            if (requiresClientAuth) {

                CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");

                X509Certificate clientCert;
                // Load client certificate
                byte[] clientCertBytes =
                        tlsConfiguration.getClientCertificateFile().getDecodedContent();
                try (ByteArrayInputStream certInputStream = new ByteArrayInputStream(clientCertBytes)) {
                    clientCert = (X509Certificate) certificateFactory.generateCertificate(certInputStream);
                    // Use the clientCert object as needed
                } finally {
                    // Clear sensitive data from memory
                    java.util.Arrays.fill(clientCertBytes, (byte) 0);
                }

                PrivateKey privateKey;
                // Load client private key
                byte[] clientKeyBytes = tlsConfiguration.getClientKeyFile().getDecodedContent();
                try {
                    privateKey = loadPrivateKey(clientKeyBytes);
                    // Use the privateKey object as needed
                } finally {
                    // Clear sensitive data from memory
                    java.util.Arrays.fill(clientKeyBytes, (byte) 0);
                }

                // KeyStore for client authentication
                KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
                keyStore.load(null, null);
                keyStore.setKeyEntry("client-key", privateKey, null, new X509Certificate[] {clientCert});

                keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
                keyManagerFactory.init(keyStore, null);
            }

            // Handle server certificate verification
            TrustManager[] trustManagers;
            if (verifyTlsCertificate) {

                // CA certificate verification
                String caCertContent =
                        new String(tlsConfiguration.getCaCertificateFile().getDecodedContent(), StandardCharsets.UTF_8);

                CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
                X509Certificate caCert = (X509Certificate)
                        certificateFactory.generateCertificate(new ByteArrayInputStream(caCertContent.getBytes()));

                KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
                trustStore.load(null, null);
                trustStore.setCertificateEntry("ca-cert", caCert);

                TrustManagerFactory trustManagerFactory =
                        TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
                trustManagerFactory.init(trustStore);
                trustManagers = trustManagerFactory.getTrustManagers();
            } else {
                trustManagers = new TrustManager[] {
                    new X509TrustManager() {
                        @Override
                        public X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }

                        @Override
                        public void checkClientTrusted(X509Certificate[] certs, String authType) {}

                        @Override
                        public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                    }
                };
            }

            // Initialize SSL context with appropriate managers
            SecureRandom secureRandom = SecureRandom.getInstance("SHA1PRNG");
            sslContext.init(
                    requiresClientAuth ? keyManagerFactory.getKeyManagers() : null, trustManagers, secureRandom);

            SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();

            // Create and return JedisPool with TLS
            JedisPool jedisPool = new JedisPool(poolConfig, uri, timeout, sslSocketFactory, null, null);
            log.debug(Thread.currentThread().getName() + ": Created Jedis pool with TLS.");
            return jedisPool;
        } catch (CertificateException | IOException e) {
            log.error("Error occurred during TLS setup (Certificate or I/O issue): {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error occurred while creating Jedis pool with TLS: {}", e.getMessage(), e);
            throw e;
        }
    }

    private static PrivateKey loadPrivateKey(byte[] keyBytes) throws Exception {
        byte[] decodedKey = null;
        try {
            String keyString = new String(keyBytes);

            String keyType = "RSA";
            if (keyString.contains("BEGIN EC PRIVATE KEY")) {
                keyType = "EC";
            }

            String cleanKey =
                    keyString.replaceAll("-----(?:BEGIN|END)[^-]+-----", "").replaceAll("\\s", "");

            decodedKey = Base64.getDecoder().decode(cleanKey);

            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decodedKey);
            KeyFactory kf = KeyFactory.getInstance(keyType);
            return kf.generatePrivate(spec);
        } catch (Exception e) {
            log.error("Unexpected error while loading private key: {}", e.getMessage(), e);
            throw e;
        } finally {
            if (decodedKey != null) {
                java.util.Arrays.fill(decodedKey, (byte) 0);
            }
        }
    }
}
