package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.SSLHelper;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.SSLDetails;
import com.arangodb.ArangoDB.Builder;
import org.pf4j.util.StringUtils;

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;

public class SSLUtils {

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
                    builder.sslContext(SSLHelper.getSslContext(datasourceConfiguration.getConnection().getSsl().getCaCertificateFile()));
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
