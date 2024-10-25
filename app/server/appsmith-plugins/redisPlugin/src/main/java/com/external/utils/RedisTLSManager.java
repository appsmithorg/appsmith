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
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.SecureRandom;
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
        boolean verifyTlsCertificate = tlsConfiguration.getVerifyTlsCertificate();
        boolean requiresClientAuth = tlsConfiguration.getRequiresClientAuth();

        SSLContext sslContext = SSLContext.getInstance("TLS");
        KeyManagerFactory keyManagerFactory = null;

        // Handle client authentication if required, regardless of certificate verification
        if (requiresClientAuth) {

            CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");

            // Load client certificate
            String clientCertContent =
                    new String(tlsConfiguration.getClientCertificateFile().getDecodedContent(), StandardCharsets.UTF_8);
            X509Certificate clientCert = (X509Certificate)
                    certificateFactory.generateCertificate(new ByteArrayInputStream(clientCertContent.getBytes()));

            // Load client private key
            String clientKey =
                    new String(tlsConfiguration.getClientKeyFile().getDecodedContent(), StandardCharsets.UTF_8);
            PrivateKey privateKey = loadPrivateKey(clientKey);

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
        sslContext.init(
                requiresClientAuth ? keyManagerFactory.getKeyManagers() : null, trustManagers, new SecureRandom());

        SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();

        // Create and return JedisPool with TLS
        JedisPool jedisPool = new JedisPool(poolConfig, uri, timeout, sslSocketFactory, null, null);
        log.debug(Thread.currentThread().getName() + ": Created Jedis pool with TLS.");
        return jedisPool;
    }

    private static PrivateKey loadPrivateKey(String clientKey) throws Exception {
        clientKey = clientKey
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(clientKey);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }
}
