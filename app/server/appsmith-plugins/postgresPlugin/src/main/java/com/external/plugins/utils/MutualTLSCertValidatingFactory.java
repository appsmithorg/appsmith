package com.external.plugins.utils;

import com.appsmith.external.helpers.RSAKeyUtil;
import org.postgresql.ssl.WrappedFactory;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.Properties;

public class MutualTLSCertValidatingFactory extends WrappedFactory {

    public MutualTLSCertValidatingFactory(Properties info) throws Exception {
        // Convert String certificates and keys to objects
        CertificateFactory cf = CertificateFactory.getInstance("X.509");

        // Client certificate
        ByteArrayInputStream clientCertIS =
                new ByteArrayInputStream(info.getProperty("clientCertString").getBytes(StandardCharsets.UTF_8));
        X509Certificate clientCertificate = (X509Certificate) cf.generateCertificate(clientCertIS);

        // Client key and this assumes we are using RSA keys
        PrivateKey privateKey;

        if (RSAKeyUtil.isPkcs1Key(info.getProperty("clientKeyString"))) {
            String rsaKey = RSAKeyUtil.replaceHeaderAndFooterFromKey(info.getProperty("clientKeyString"));
            privateKey = RSAKeyUtil.readPkcs1PrivateKey(rsaKey);
        } else {
            String rsaKey = RSAKeyUtil.replaceHeaderAndFooterFromKey(info.getProperty("clientKeyString"));
            privateKey = RSAKeyUtil.readPkcs8PrivateKey(Base64.getDecoder().decode(rsaKey));
        }

        // CA certificate for verifying the server
        ByteArrayInputStream caCertIS =
                new ByteArrayInputStream(info.getProperty("serverCACertString").getBytes(StandardCharsets.UTF_8));
        X509Certificate caCertificate = (X509Certificate) cf.generateCertificate(caCertIS);

        // Client keystore
        KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
        keyStore.load(null, null);
        keyStore.setCertificateEntry("client-cert", clientCertificate);
        keyStore.setKeyEntry("client-key", privateKey, "password".toCharArray(), new java.security.cert.Certificate[] {
            clientCertificate
        });

        // Truststore
        KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
        trustStore.load(null, null);
        trustStore.setCertificateEntry("ca-cert", caCertificate);

        // Initialize SSLContext
        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        tmf.init(trustStore);

        KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(keyStore, "password".toCharArray());

        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), new SecureRandom());

        this.factory = sslContext.getSocketFactory();
    }
}
