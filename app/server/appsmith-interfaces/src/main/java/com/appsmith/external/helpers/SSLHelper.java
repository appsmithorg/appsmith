package com.appsmith.external.helpers;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import reactor.netty.tcp.DefaultSslContextSpec;
import reactor.netty.tcp.SslProvider;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.function.Consumer;

public class SSLHelper {

    private static final String X_509_TYPE = "X.509";
    private static final String CERT_ALIAS = "caCert";
    private static final String SSL_PROTOCOL = "TLS";

    public static SSLContext getSslContext(UploadedFile certificate)
            throws CertificateException, KeyStoreException, IOException, NoSuchAlgorithmException, KeyManagementException {

        final TrustManagerFactory trustManagerFactory = getSslTrustManagerFactory(certificate);

        SSLContext sslContext = SSLContext.getInstance(SSL_PROTOCOL);
        sslContext.init(null, trustManagerFactory.getTrustManagers(), null);

        return sslContext;
    }

    public static TrustManagerFactory getSslTrustManagerFactory(UploadedFile certificate)
            throws CertificateException, KeyStoreException, IOException, NoSuchAlgorithmException {
        InputStream certificateIs =
                new ByteArrayInputStream(certificate.getDecodedContent());
        CertificateFactory certificateFactory = CertificateFactory.getInstance(X_509_TYPE);
        X509Certificate caCertificate =
                (X509Certificate) certificateFactory.generateCertificate(certificateIs);

        KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
        keyStore.load(null);
        keyStore.setCertificateEntry(CERT_ALIAS, caCertificate);

        TrustManagerFactory trustManagerFactory =
                TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        trustManagerFactory.init(keyStore);

        return trustManagerFactory;
    }

    public static Consumer<? super SslProvider.SslContextSpec> sslCheckForHttpClient(DatasourceConfiguration datasourceConfiguration) {

        return (sslContextSpec) -> {
            final DefaultSslContextSpec sslContextSpec1 = DefaultSslContextSpec.forClient();

            if (datasourceConfiguration.getConnection() != null &&
                    datasourceConfiguration.getConnection().getSsl() != null &&
                    datasourceConfiguration.getConnection().getSsl().getAuthType() == SSLDetails.AuthType.SELF_SIGNED_CERTIFICATE) {

                sslContextSpec1.configure(sslContextBuilder -> {
                    try {
                        final UploadedFile certificateFile = datasourceConfiguration.getConnection().getSsl().getCertificateFile();
                        sslContextBuilder.trustManager(SSLHelper.getSslTrustManagerFactory(certificateFile));
                    } catch (CertificateException | KeyStoreException | IOException | NoSuchAlgorithmException e) {
                        e.printStackTrace();
                    }
                });
            }
            sslContextSpec.sslContext(sslContextSpec1);
        };
    }
}
