package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.SSLDetails;
import com.arangodb.ArangoDB.Builder;
import org.pf4j.util.StringUtils;

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

public class SSLUtils {

    private static final String X_509_TYPE = "X.509";
    private static final String CERT_ALIAS = "caCert";
    private static final String SSL_PROTOCOL = "TLS";

    public static SSLContext getSslContext(DatasourceConfiguration datasourceConfiguration) throws CertificateException
            , KeyStoreException, IOException, NoSuchAlgorithmException, KeyManagementException {
        InputStream certificateIs =
                new ByteArrayInputStream(datasourceConfiguration.getConnection().getSsl()
                        .getCaCertificateFile().getDecodedContent());
        CertificateFactory certificateFactory = CertificateFactory.getInstance(X_509_TYPE);
        X509Certificate caCertificate =
                (X509Certificate) certificateFactory.generateCertificate(certificateIs);

        KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
        keyStore.load(null);
        keyStore.setCertificateEntry(CERT_ALIAS, caCertificate);

        TrustManagerFactory trustManagerFactory =
                TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        trustManagerFactory.init(keyStore);

        SSLContext sslContext = SSLContext.getInstance(SSL_PROTOCOL);
        sslContext.init(null, trustManagerFactory.getTrustManagers(), null);

        return sslContext;
    }

    public static boolean isCaCertificateAvailable(DatasourceConfiguration datasourceConfiguration) {
        if (datasourceConfiguration.getConnection() != null
                && datasourceConfiguration.getConnection().getSsl() != null
                && datasourceConfiguration.getConnection().getSsl().getCaCertificateFile() != null
                && StringUtils.isNotNullOrEmpty(datasourceConfiguration.getConnection().getSsl()
                .getCaCertificateFile().getBase64Content())) {
            return true;
        }

        return false;
    }

    public static void setSSLParam(Builder builder, SSLDetails.AuthType authType) {
        switch (authType) {
            case DEFAULT:
                /* do nothing i.e. use default driver setting */

                break;
            case ENABLED:
                builder.useSsl(true);

                break;
            case DISABLED:
                builder.useSsl(false);

                break;
            default:
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server has found an unexpected SSL option: " + authType + ". Please reach " +
                                "out to Appsmith customer support to resolve this."
                );
        }
    }

    public static void setSSLContext(Builder builder, DatasourceConfiguration datasourceConfiguration) {

        SSLDetails.CACertificateType caCertificateType = datasourceConfiguration.getConnection().getSsl()
                .getCaCertificateType();

        switch (caCertificateType) {
            case NONE:
                /* do nothing */

                break;
            case FILE:
            case BASE64_STRING:
                try {
                    builder.sslContext(getSslContext(datasourceConfiguration));
                } catch (CertificateException | KeyStoreException | IOException | NoSuchAlgorithmException
                        | KeyManagementException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Appsmith server encountered an error when getting ssl context. Please contact Appsmith " +
                                    "customer support to resolve this."
                    );
                }

                break;
            default:
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server has found an unexpected CA certificate option: " + caCertificateType + ". " +
                        "Please reach out to Appsmith customer support to resolve this."
                );
        }
    }
}
