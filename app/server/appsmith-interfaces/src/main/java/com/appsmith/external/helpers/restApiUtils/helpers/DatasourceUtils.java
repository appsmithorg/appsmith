package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.CollectionUtils;

import java.util.HashSet;
import java.util.Set;

@NoArgsConstructor
public class DatasourceUtils {

    protected static HeaderUtils headerUtils = new HeaderUtils();

    public Set<String> validateDatasource(
            DatasourceConfiguration datasourceConfiguration, boolean isEmbeddedDatasource) {
        /**
         * We don't verify whether the URL is in valid format because it can contain mustache template keys, and so
         * look invalid at this point, but become valid after mustache rendering. So we just check if URL field has
         * a non-empty value.
         */
        Set<String> invalids = new HashSet<>();

        if (StringUtils.isEmpty(datasourceConfiguration.getUrl())) {
            if (isEmbeddedDatasource) {
                /**
                 * Deliberately skipping adding any invalidity message here because based on the current parsing logic the
                 * client can skip adding a URL to embedded datasource and instead add the entire URL to
                 * `actionConfiguration.path`.
                 * ref: https://theappsmith.slack.com/archives/C040LHZN03V/p1686478370473659?thread_ts=1686300736
                 * .679729&cid=C040LHZN03V
                 */
            } else {
                invalids.add("Missing URL.");
            }
        }

        final String contentTypeError = headerUtils.verifyContentType(datasourceConfiguration.getHeaders());
        if (contentTypeError != null) {
            invalids.add("Invalid Content-Type: " + contentTypeError);
        }

        if (!CollectionUtils.isEmpty(datasourceConfiguration.getProperties())) {
            boolean isSendSessionEnabled = false;
            String secretKey = null;

            for (Property property : datasourceConfiguration.getProperties()) {
                if ("isSendSessionEnabled".equals(property.getKey())) {
                    isSendSessionEnabled = "Y".equals(property.getValue());
                } else if ("sessionSignatureKey".equals(property.getKey())) {
                    secretKey = (String) property.getValue();
                }
            }

            if (isSendSessionEnabled && (StringUtils.isEmpty(secretKey) || secretKey.length() < 32)) {
                invalids.add("Secret key is required when sending session is switched on"
                        + ", and should be at least 32 characters long.");
            }
        }

        try {
            headerUtils.getSignatureKey(datasourceConfiguration);
        } catch (AppsmithPluginException e) {
            invalids.add(e.getMessage());
        }

        if (datasourceConfiguration.getAuthentication() != null) {
            invalids.addAll(DatasourceValidator.validateAuthentication(datasourceConfiguration.getAuthentication()));
        }

        return invalids;
    }
}
