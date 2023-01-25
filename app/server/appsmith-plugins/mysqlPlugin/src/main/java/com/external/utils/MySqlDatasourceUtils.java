package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.exceptions.MySQLErrorMessages;
import com.external.plugins.exceptions.MySQLPluginError;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.pool.ConnectionPoolConfiguration;
import io.r2dbc.spi.ConnectionFactoryOptions;
import io.r2dbc.spi.Option;
import org.apache.commons.lang.ObjectUtils;
import org.mariadb.r2dbc.MariadbConnectionConfiguration;
import org.mariadb.r2dbc.MariadbConnectionFactory;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static io.r2dbc.pool.PoolingConnectionFactoryProvider.MAX_SIZE;
import static io.r2dbc.spi.ConnectionFactoryOptions.SSL;

public class MySqlDatasourceUtils {

    public static int MAX_CONNECTION_POOL_SIZE = 5;

    private static final Duration MAX_IDLE_TIME = Duration.ofMinutes(10);

    public static ConnectionFactoryOptions.Builder getBuilder(DatasourceConfiguration datasourceConfiguration) {
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

        StringBuilder urlBuilder = new StringBuilder();
        if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
            urlBuilder.append(datasourceConfiguration.getUrl());
        } else {
            urlBuilder.append("r2dbc:pool:mariadb://");
            final List<String> hosts = new ArrayList<>();

            for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                hosts.add(endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 3306L));
            }

            urlBuilder.append(String.join(",", hosts)).append("/");

            if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                urlBuilder.append(authentication.getDatabaseName());
            }

        }

        urlBuilder.append("?zeroDateTimeBehavior=convertToNull&allowMultiQueries=true");
        final List<Property> dsProperties = datasourceConfiguration.getProperties();

        if (dsProperties != null) {
            for (Property property : dsProperties) {
                if ("serverTimezone".equals(property.getKey()) && !StringUtils.isEmpty(property.getValue())) {
                    urlBuilder.append("&serverTimezone=").append(property.getValue());
                    break;
                }
            }
        }

        ConnectionFactoryOptions baseOptions = ConnectionFactoryOptions.parse(urlBuilder.toString());
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions)
                .option(ConnectionFactoryOptions.USER, authentication.getUsername())
                .option(ConnectionFactoryOptions.PASSWORD, authentication.getPassword());

        return ob;
    }

    public static ConnectionFactoryOptions.Builder addSslOptionsToBuilder(DatasourceConfiguration datasourceConfiguration,
                                                                          ConnectionFactoryOptions.Builder ob) throws AppsmithPluginException {
        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            MySQLErrorMessages.SSL_CONFIGURATION_FETCHING_ERROR_MSG
                            );
        }

        /*
         * - By default, the driver configures SSL in the preferred mode.
         */
        SSLDetails.AuthType sslAuthType = datasourceConfiguration.getConnection().getSsl().getAuthType();
        switch (sslAuthType) {
            case REQUIRED:
                ob = ob
                        .option(SSL, true)
                        .option(Option.valueOf("sslMode"), sslAuthType.toString().toLowerCase());

                break;
            case DISABLED:
                ob = ob.option(SSL, false);

                break;
            case DEFAULT:
                /* do nothing - accept default driver setting*/

                break;
            default:
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        String.format(MySQLErrorMessages.UNEXPECTED_SSL_OPTION_ERROR_MSG, sslAuthType)
                        );
        }

        return ob;
    }

    public static Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
        Set<String> invalids = new HashSet<>();

        if (datasourceConfiguration.getConnection() != null
                && datasourceConfiguration.getConnection().getMode() == null) {
            invalids.add(MySQLErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG);
        }

        if (StringUtils.isEmpty(datasourceConfiguration.getUrl()) &&
                CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
            invalids.add(MySQLErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG);
        } else if (!CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
            for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                if (endpoint.getHost() == null || endpoint.getHost().isBlank()) {
                    invalids.add(MySQLErrorMessages.DS_MISSING_HOSTNAME_ERROR_MSG);
                } else if (endpoint.getHost().contains("/") || endpoint.getHost().contains(":")) {
                    invalids.add(String.format(MySQLErrorMessages.DS_INVALID_HOSTNAME_ERROR_MSG, endpoint.getHost()));
                }
            }
        }

        if (datasourceConfiguration.getAuthentication() == null) {
            invalids.add(MySQLErrorMessages.DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG);
        } else {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (StringUtils.isEmpty(authentication.getUsername())) {
                invalids.add(MySQLErrorMessages.DS_MISSING_USERNAME_ERROR_MSG);
            }

            if (StringUtils.isEmpty(authentication.getPassword()) && StringUtils.isEmpty(authentication.getUsername())) {
                invalids.add(MySQLErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG);
            } else if (StringUtils.isEmpty(authentication.getPassword())) {
                // it is valid if it has the username but not the password
                authentication.setPassword("");
            }

            if (StringUtils.isEmpty(authentication.getDatabaseName())) {
                invalids.add(MySQLErrorMessages.DS_MISSING_DATABASE_NAME_ERROR_MSG);
            }
        }

        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            invalids.add(MySQLErrorMessages.DS_SSL_CONFIGURATION_FETCHING_FAILED_ERROR_MSG);
        }

        return invalids;
    }

    public static ConnectionPool getNewConnectionPool(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
        ConnectionFactoryOptions.Builder ob = getBuilder(datasourceConfiguration);
        ob = addSslOptionsToBuilder(datasourceConfiguration, ob);
        MariadbConnectionFactory connectionFactory =
                MariadbConnectionFactory.from(
                        MariadbConnectionConfiguration.fromOptions(ob.build())
                                .allowPublicKeyRetrieval(true).build()
                );

        /**
         * The pool configuration object does not seem to have any option to set the minimum pool size, hence could
         * not configure the minimum pool size.
         */
        ConnectionPoolConfiguration configuration = ConnectionPoolConfiguration.builder(connectionFactory)
                .maxIdleTime(MAX_IDLE_TIME)
                .maxSize(MAX_CONNECTION_POOL_SIZE)
                .build();
        return new ConnectionPool(configuration);
    }
}
