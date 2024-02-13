package com.external.plugins.utils;

import org.postgresql.ssl.WrappedFactory;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.io.ByteArrayInputStream;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.Properties;

public class MutualTLSCertValidatingFactory extends WrappedFactory {

    public MutualTLSCertValidatingFactory(Properties info) throws Exception {
        // Convert String certificates and keys to objects
        CertificateFactory cf = CertificateFactory.getInstance("X.509");

        // Client certificate
        ByteArrayInputStream clientCertIS =
                new ByteArrayInputStream(Base64.getDecoder().decode(info.getProperty("clientCertString")));
        X509Certificate clientCertificate = (X509Certificate) cf.generateCertificate(clientCertIS);

        // Client key
        KeyFactory kf = KeyFactory.getInstance("RSA"); // Assuming RSA key
        PrivateKey privateKey = readPkcs1PrivateKey(Base64.getDecoder().decode(info.getProperty("clientKeyString")));

        // CA certificate for verifying the server
        ByteArrayInputStream caCertIS =
                new ByteArrayInputStream(Base64.getDecoder().decode(info.getProperty("serverCACertString")));
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

    private static PrivateKey readPkcs8PrivateKey(byte[] pkcs8Bytes) throws GeneralSecurityException {
        KeyFactory keyFactory = KeyFactory.getInstance("RSA", "SunRsaSign");
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(pkcs8Bytes);
        try {
            return keyFactory.generatePrivate(keySpec);
        } catch (InvalidKeySpecException e) {
            throw new IllegalArgumentException("Unexpected key format!", e);
        }
    }

    private static PrivateKey readPkcs1PrivateKey(byte[] pkcs1Bytes) throws GeneralSecurityException {
        // We can't use Java internal APIs to parse ASN.1 structures, so we build a PKCS#8 key Java can understand
        int pkcs1Length = pkcs1Bytes.length;
        int totalLength = pkcs1Length + 22;
        byte[] pkcs8Header = new byte[] {
            0x30,
            (byte) 0x82,
            (byte) ((totalLength >> 8) & 0xff),
            (byte) (totalLength & 0xff), // Sequence + total length
            0x2,
            0x1,
            0x0, // Integer (0)
            0x30,
            0xD,
            0x6,
            0x9,
            0x2A,
            (byte) 0x86,
            0x48,
            (byte) 0x86,
            (byte) 0xF7,
            0xD,
            0x1,
            0x1,
            0x1,
            0x5,
            0x0, // Sequence: 1.2.840.113549.1.1.1, NULL
            0x4,
            (byte) 0x82,
            (byte) ((pkcs1Length >> 8) & 0xff),
            (byte) (pkcs1Length & 0xff) // Octet string + length
        };
        byte[] pkcs8bytes = join(pkcs8Header, pkcs1Bytes);
        return readPkcs8PrivateKey(pkcs8bytes);
    }

    private static byte[] join(byte[] byteArray1, byte[] byteArray2) {
        byte[] bytes = new byte[byteArray1.length + byteArray2.length];
        System.arraycopy(byteArray1, 0, bytes, 0, byteArray1.length);
        System.arraycopy(byteArray2, 0, bytes, byteArray1.length, byteArray2.length);
        return bytes;
    }
}
