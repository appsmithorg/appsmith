package com.external.plugins.utils;

import org.postgresql.ssl.WrappedFactory;
import org.postgresql.util.GT;

import javax.net.ssl.KeyManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.UUID;

public class StringCertValidatingFactory extends WrappedFactory {

    private static final String FILE_PREFIX = "cert:";

    public StringCertValidatingFactory(String sslFactoryArg) throws GeneralSecurityException {
        if (sslFactoryArg != null && !sslFactoryArg.isEmpty()) {
            String val;
            if (sslFactoryArg.startsWith("cert:")) {
                val = sslFactoryArg.substring("cert:".length());
                if (val.isEmpty()) {
                    throw new IllegalArgumentException(GT.tr(
                            "Certificate value is empty, please make sure that the certificate is added correctly"));
                }

                try {
                    SSLContext ctx = SSLContext.getInstance("TLS");
                    ctx.init(
                            (KeyManager[]) null,
                            new TrustManager[] {new StringCertValidatingFactory.SingleCertTrustManager(val)},
                            null);
                    this.factory = ctx.getSocketFactory();
                } catch (RuntimeException var14) {
                    throw var14;
                } catch (Exception var15) {
                    if (var15 instanceof GeneralSecurityException) {
                        throw (GeneralSecurityException) var15;
                    }

                    throw new GeneralSecurityException(
                            GT.tr("An error occurred reading the certificate", new Object[0]), var15);
                }

            } else {
                throw new GeneralSecurityException(
                        GT.tr("The sslfactoryarg property may not be empty.", new Object[0]));
            }
        }
    }

    public static class SingleCertTrustManager implements X509TrustManager {
        X509Certificate cert;
        X509TrustManager trustManager;

        public SingleCertTrustManager(String certToTrust) throws IOException, GeneralSecurityException {
            InputStream in = new ByteArrayInputStream(certToTrust.getBytes());
            KeyStore ks = KeyStore.getInstance(KeyStore.getDefaultType());
            ks.load((KeyStore.LoadStoreParameter) null);
            CertificateFactory cf = CertificateFactory.getInstance("X509");
            this.cert = (X509Certificate) cf.generateCertificate(in);
            ks.setCertificateEntry(UUID.randomUUID().toString(), this.cert);
            TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            tmf.init(ks);
            TrustManager[] var5 = tmf.getTrustManagers();
            int var6 = var5.length;

            for (int var7 = 0; var7 < var6; ++var7) {
                TrustManager tm = var5[var7];
                if (tm instanceof X509TrustManager) {
                    this.trustManager = (X509TrustManager) tm;
                    break;
                }
            }

            if (this.trustManager == null) {
                throw new GeneralSecurityException(GT.tr("No X509TrustManager found", new Object[0]));
            }
        }

        public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {}

        public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
            this.trustManager.checkServerTrusted(chain, authType);
        }

        public X509Certificate[] getAcceptedIssuers() {
            return new X509Certificate[] {this.cert};
        }
    }
}
