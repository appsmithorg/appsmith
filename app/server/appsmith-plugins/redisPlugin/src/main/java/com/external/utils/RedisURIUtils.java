package com.external.utils;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;

public class RedisURIUtils {
    private static final Long DEFAULT_PORT = 6379L;
    private static final String REDIS_SCHEME = "redis://";

    public static URI getURI(DatasourceConfiguration datasourceConfiguration) throws URISyntaxException {
        StringBuilder builder = new StringBuilder();
        builder.append(REDIS_SCHEME);

        String uriAuth = getUriAuth(datasourceConfiguration);
        builder.append(uriAuth);

        String uriHostAndPort = getUriHostAndPort(datasourceConfiguration);
        builder.append(uriHostAndPort);

        String uriDatabase = getUriDatabase(datasourceConfiguration);
        builder.append(uriDatabase);

        return new URI(builder.toString());
    }

    private static String getUriDatabase(DatasourceConfiguration datasourceConfiguration) {
        StringBuilder builder = new StringBuilder();
        DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
        if (auth != null && StringUtils.isNotNullOrEmpty(auth.getDatabaseName())) {
            builder.append("/" + auth.getDatabaseName());
        }

        return builder.toString();
    }

    // Skipping validation checks, since they are taken care of via 'validateDatasource(...)' method.
    private static String getUriHostAndPort(DatasourceConfiguration datasourceConfiguration) {
        // Jedis does not have support for backup hosts.
        Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
        String host = endpoint.getHost();
        Integer port = (int) (long) ObjectUtils.defaultIfNull(endpoint.getPort(), DEFAULT_PORT);
        StringBuilder builder = new StringBuilder();
        builder.append(host + ":" + port);

        return builder.toString();
    }

    // Skipping validation checks, since they are taken care of via 'validateDatasource(...)' method.
    private static String getUriAuth(DatasourceConfiguration datasourceConfiguration) {
        StringBuilder builder = new StringBuilder();
        DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
        if (auth != null && StringUtils.isNotNullOrEmpty(auth.getPassword())) {
            if (StringUtils.isNotNullOrEmpty(auth.getUsername())) {
                // If username is available, then provide username.
                builder.append(auth.getUsername());
            }

            builder.append(":" + auth.getPassword() + "@");
        }

        return builder.toString();
    }
}
