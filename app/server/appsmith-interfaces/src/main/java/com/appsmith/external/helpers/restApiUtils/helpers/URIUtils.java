package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.apache.commons.collections.CollectionUtils.isEmpty;
import static org.apache.commons.lang3.StringUtils.isNotEmpty;

@NoArgsConstructor
public class URIUtils {
    public static final Set<String> DISALLOWED_HOSTS = Set.of(
            "169.254.169.254",
            "metadata.google.internal"
    );

    public URI createUriWithQueryParams(ActionConfiguration actionConfiguration,
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

        return addQueryParamsToURI(new URI(httpUrl), allQueryParams, encodeParamsToggle);
    }

    public URI addQueryParamsToURI(URI uri, List<Property> allQueryParams, boolean encodeParamsToggle) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        uriBuilder.uri(uri);

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

    protected String addHttpToUrlWhenPrefixNotPresent(String url) {
        if (url == null || url.toLowerCase().startsWith("http") || url.contains("://")) {
            return url;
        }
        return "http://" + url;
    }

    public boolean isHostDisallowed(URI uri) throws UnknownHostException {
        String host = uri.getHost();
        return StringUtils.isEmpty(host) || DISALLOWED_HOSTS.contains(host)
                || DISALLOWED_HOSTS.contains(InetAddress.getByName(host).getHostAddress());
    }
}
