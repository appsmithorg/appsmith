package com.external.plugins;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * A throwaway TLS identity for {@code localhost} and {@code my-bucket.localhost}, generated with the JDK's keytool for
 * one test class, and a trust store that holds the JDK's default CAs plus that identity.
 *
 * <p>The S3 clients build their TLS context from the JVM's default trust store, so {@link #trustInThisJvm()} points
 * {@code javax.net.ssl.trustStore} at the combined store for the duration of a test class; {@link #close()} restores
 * the previous setting. Because the combined store keeps the default CAs, anything else that opens a TLS connection in
 * the meantime is unaffected.
 */
final class TestTls implements AutoCloseable {

    private static final char[] PASSWORD = "changeit".toCharArray();
    private static final String ALIAS = "s3-wire";
    private static final String TRUST_STORE_PROPERTY = "javax.net.ssl.trustStore";
    private static final String TRUST_STORE_PASSWORD_PROPERTY = "javax.net.ssl.trustStorePassword";
    private static final String TRUST_STORE_TYPE_PROPERTY = "javax.net.ssl.trustStoreType";

    private final Path keyStoreFile;
    private final Path trustStoreFile;
    private String previousTrustStore;
    private String previousTrustStorePassword;
    private String previousTrustStoreType;

    private TestTls(Path keyStoreFile, Path trustStoreFile) {
        this.keyStoreFile = keyStoreFile;
        this.trustStoreFile = trustStoreFile;
    }

    static TestTls generate(Path directory) throws Exception {
        Files.createDirectories(directory);
        Path keyStoreFile = directory.resolve("wire-identity.p12");
        Path trustStoreFile = directory.resolve("wire-truststore.p12");
        Files.deleteIfExists(keyStoreFile);
        String keytool =
                Path.of(System.getProperty("java.home"), "bin", "keytool").toString();
        Process process = new ProcessBuilder(List.of(
                        keytool,
                        "-genkeypair",
                        "-alias",
                        ALIAS,
                        "-keyalg",
                        "RSA",
                        "-keysize",
                        "2048",
                        "-validity",
                        "2",
                        "-dname",
                        "CN=localhost",
                        "-ext",
                        "SAN=dns:localhost,dns:my-bucket.localhost,ip:127.0.0.1",
                        "-keystore",
                        keyStoreFile.toString(),
                        "-storetype",
                        "PKCS12",
                        "-storepass",
                        new String(PASSWORD),
                        "-keypass",
                        new String(PASSWORD)))
                .redirectErrorStream(true)
                .start();
        String output = new String(process.getInputStream().readAllBytes());
        if (!process.waitFor(60, TimeUnit.SECONDS) || process.exitValue() != 0) {
            throw new IllegalStateException("keytool failed: " + output);
        }

        KeyStore identity = load(keyStoreFile);
        Certificate certificate = identity.getCertificate(ALIAS);
        KeyStore trust = KeyStore.getInstance("PKCS12");
        Path cacerts = Path.of(System.getProperty("java.home"), "lib", "security", "cacerts");
        try (InputStream in = Files.newInputStream(cacerts)) {
            trust.load(in, PASSWORD);
        }
        trust.setCertificateEntry(ALIAS, certificate);
        try (OutputStream out = Files.newOutputStream(trustStoreFile)) {
            trust.store(out, PASSWORD);
        }
        return new TestTls(keyStoreFile, trustStoreFile);
    }

    SSLSocketFactory serverSocketFactory() throws Exception {
        KeyManagerFactory keyManagers = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        keyManagers.init(load(keyStoreFile), PASSWORD);
        SSLContext context = SSLContext.getInstance("TLS");
        context.init(keyManagers.getKeyManagers(), null, null);
        return context.getSocketFactory();
    }

    TestTls trustInThisJvm() {
        previousTrustStore = System.getProperty(TRUST_STORE_PROPERTY);
        previousTrustStorePassword = System.getProperty(TRUST_STORE_PASSWORD_PROPERTY);
        previousTrustStoreType = System.getProperty(TRUST_STORE_TYPE_PROPERTY);
        System.setProperty(TRUST_STORE_PROPERTY, trustStoreFile.toString());
        System.setProperty(TRUST_STORE_PASSWORD_PROPERTY, new String(PASSWORD));
        System.setProperty(TRUST_STORE_TYPE_PROPERTY, "PKCS12");
        return this;
    }

    @Override
    public void close() {
        restore(TRUST_STORE_PROPERTY, previousTrustStore);
        restore(TRUST_STORE_PASSWORD_PROPERTY, previousTrustStorePassword);
        restore(TRUST_STORE_TYPE_PROPERTY, previousTrustStoreType);
    }

    private static void restore(String property, String value) {
        if (value == null) {
            System.clearProperty(property);
        } else {
            System.setProperty(property, value);
        }
    }

    private static KeyStore load(Path file) throws IOException {
        try (InputStream in = Files.newInputStream(file)) {
            KeyStore store = KeyStore.getInstance("PKCS12");
            store.load(in, PASSWORD);
            return store;
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            throw new IOException(e);
        }
    }
}
