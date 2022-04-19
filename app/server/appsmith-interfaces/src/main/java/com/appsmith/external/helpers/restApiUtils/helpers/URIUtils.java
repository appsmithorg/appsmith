package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

import static org.apache.commons.collections.CollectionUtils.isEmpty;
import static org.apache.commons.lang.StringUtils.isNotEmpty;

public class URIUtils {
    public static URI createFinalUriWithQueryParams(ActionConfiguration actionConfiguration,
                                                       DatasourceConfiguration datasourceConfiguration, String url,
                                                       boolean encodeParamsToggle) throws URISyntaxException {
        String httpUrl = addHttpToUrlWhenPrefixNotPresent(url);

        ArrayList<Property> allQueryParams = new ArrayList<>();
        if (!isEmpty(actionConfiguration.getQueryParameters())) {
            allQueryParams.addAll(actionConfiguration.getQueryParameters());
        }

        if (!isEmpty(datasourceConfiguration.getQueryParameters())) {
            allQueryParams.addAll(datasourceConfiguration.getQueryParameters());
        }

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        uriBuilder.uri(new URI(httpUrl));

        if (allQueryParams != null) {
            for (Property queryParam : allQueryParams) {
                String key = queryParam.getKey();
                if (isNotEmpty(key)) {
                    if (encodeParamsToggle == true) {
                        uriBuilder.queryParam(
                                URLEncoder.encode(key, StandardCharsets.UTF_8),
                                URLEncoder.encode((String) queryParam.getValue(), StandardCharsets.UTF_8)
                        );
                    } else {
                        uriBuilder.queryParam(
                                key,
                                queryParam.getValue()
                        );
                    }
                }
            }
        }

        return uriBuilder.build(true).toUri();
    }

    public static String addHttpToUrlWhenPrefixNotPresent(String url) {
        if (url == null || url.toLowerCase().startsWith("http") || url.contains("://")) {
            return url;
        }
        return "http://" + url;
    }
}
