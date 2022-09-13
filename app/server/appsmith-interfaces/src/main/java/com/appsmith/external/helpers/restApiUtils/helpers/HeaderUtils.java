package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.lang.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.stream.Collectors;

@NoArgsConstructor
public class HeaderUtils {
    public static final String IS_SEND_SESSION_ENABLED_KEY = "isSendSessionEnabled";
    public static final String SESSION_SIGNATURE_KEY_KEY = "sessionSignatureKey";

    public boolean isEncodeParamsToggleEnabled(ActionConfiguration actionConfiguration) {
        /**
         * If encodeParamsToggle is null, then assume it to be true because params are supposed to be
         * encoded by default, unless explicitly prohibited by the user.
         */
        if (actionConfiguration.getEncodeParamsToggle() != null
                && actionConfiguration.getEncodeParamsToggle() == false) {
            return false;
        }

        return true;
    }

    public void removeEmptyHeaders(ActionConfiguration actionConfiguration) {
        /**
         * We only check for key being empty since an empty value is still a valid header.
         * Ref: https://stackoverflow.com/questions/12130910/how-to-interpret-empty-http-accept-header
         */
        if (actionConfiguration.getHeaders() != null && !actionConfiguration.getHeaders().isEmpty()) {
            List<Property> headerList = actionConfiguration.getHeaders().stream()
                    .filter(header -> !org.springframework.util.StringUtils.isEmpty(header.getKey()))
                    .collect(Collectors.toList());
            actionConfiguration.setHeaders(headerList);
        }
    }

    public String getRequestContentType(ActionConfiguration actionConfiguration,
                                               DatasourceConfiguration datasourceConfiguration) {
        String reqContentType = "";

        /* Get request content type from datasource config */
        if (datasourceConfiguration.getHeaders() != null) {
            reqContentType = getRequestContentTypeFromHeaders(datasourceConfiguration.getHeaders());
        }

        /* Get request content type from query config */
        if (actionConfiguration.getHeaders() != null) {
            reqContentType = getRequestContentTypeFromHeaders(actionConfiguration.getHeaders());
        }

        return reqContentType;
    }

    protected String getRequestContentTypeFromHeaders(List<Property> headers) {
        String contentType = "";
        for (Property header : headers) {
            String key = header.getKey();
            if (HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(key)) {
                contentType = (String) header.getValue();
            }
        }

        return contentType;
    }

    /**
     * If the headers list of properties contains a `Content-Type` header, verify if the value of that header is a
     * valid media type.
     *
     * @param headers List of header Property objects to look for Content-Type headers in.
     * @return An error message string if the Content-Type value is invalid, otherwise `null`.
     */
    public String verifyContentType(List<Property> headers) {
        if (headers == null) {
            return null;
        }

        for (Property header : headers) {
            if (StringUtils.isNotEmpty(header.getKey()) && header.getKey().equalsIgnoreCase(HttpHeaders.CONTENT_TYPE)) {
                try {
                    MediaType.valueOf((String) header.getValue());
                } catch (InvalidMediaTypeException e) {
                    return e.getMessage();
                }
                // Don't break here since there can be multiple `Content-Type` headers.
            }
        }

        return null;
    }

    public String getSignatureKey(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
        if (!CollectionUtils.isEmpty(datasourceConfiguration.getProperties())) {
            boolean isSendSessionEnabled = false;
            String secretKey = null;

            for (Property property : datasourceConfiguration.getProperties()) {
                if (IS_SEND_SESSION_ENABLED_KEY.equals(property.getKey())) {
                    isSendSessionEnabled = "Y".equals(property.getValue());
                } else if (SESSION_SIGNATURE_KEY_KEY.equals(property.getKey())) {
                    secretKey = (String) property.getValue();
                }
            }

            if (isSendSessionEnabled) {
                if (StringUtils.isEmpty(secretKey) || secretKey.length() < 32) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Secret key is required when sending session details is switched on," +
                                    " and should be at least 32 characters in length."
                    );
                }
                return secretKey;
            }
        }

        return null;
    }

}
