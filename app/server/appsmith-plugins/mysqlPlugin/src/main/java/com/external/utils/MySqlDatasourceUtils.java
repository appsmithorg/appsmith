package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.exceptions.MySQLErrorMessages;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.pool.ConnectionPoolConfiguration;
import io.r2dbc.spi.ConnectionFactoryOptions;
import io.r2dbc.spi.Option;
import org.mariadb.r2dbc.MariadbConnectionConfiguration;
import org.mariadb.r2dbc.MariadbConnectionFactory;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.appsmith.external.constants.PluginConstants.HostName.LOCALHOST;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_INVALID_SSH_HOSTNAME_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_MISSING_SSH_HOSTNAME_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_MISSING_SSH_KEY_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.DS_MISSING_SSH_USERNAME_ERROR_MSG;
import static com.appsmith.external.helpers.SSHUtils.isSSHEnabled;
import static com.external.plugins.MySqlPlugin.CONNECTION_METHOD_INDEX;
import static com.external.plugins.MySqlPlugin.MYSQL_DEFAULT_PORT;
import static io.r2dbc.spi.ConnectionFactoryOptions.SSL;
import static org.apache.commons.lang3.ObjectUtils.defaultIfNull;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.springframework.util.CollectionUtils.isEmpty;

public class MySqlDatasourceUtils {

    public static int MAX_CONNECTION_POOL_SIZE = 20;

    /**
     * 1 sec is the recommended value as shown in the example here:
     * https://mariadb.com/docs/xpand/connect/programming-languages/java-r2dbc/native/connection-pools/
     *
     * Current understanding is that the issue mentioned in #17324 is because of at least one of the connections
     * malfunctioning and causing the reactor thread pool / scheduler to get stuck and not schedule new tasks.
     * Setting max idle time value to 1 sec could also be seen as a precaution move to make sure that we don't land
     * into a situation where an idle thread can malfunction.
     */
    private static final Duration MAX_IDLE_TIME = Duration.ofSeconds(1);

    /**
     * Current understanding is that the issue mentioned in #17324 is because of at least one of the connections
     * malfunctioning and causing the reactor thread pool / scheduler to get stuck and not schedule new tasks.
     * Setting max lifetime value to 5 min is a precaution move to make sure that we don't land into a situation
     * where an older connection can malfunction.
     * To understand what this config means please check here: https://github.com/r2dbc/r2dbc-pool
     */
    private static final Duration MAX_LIFE_TIME = Duration.ofMinutes(5);

    /**
     * Current understanding is that the issue mentioned in #17324 is because of at least one of the connections
     * malfunctioning and causing the reactor thread pool / scheduler to get stuck and not schedule new tasks.
     * Setting eviction time value to 5 min is a precaution move to make sure that we don't land into a situation
     * where an older connection can malfunction.
     * To understand what this config means please check here: https://github.com/r2dbc/r2dbc-pool
     */
    public static final Duration BACKGROUND_EVICTION_TIME = Duration.ofMinutes(5);

    public static ConnectionFactoryOptions.Builder getBuilder(
            DatasourceConfiguration datasourceConfiguration, ConnectionContext connectionContext) {
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

        StringBuilder urlBuilder = new StringBuilder();
        if (isEmpty(datasourceConfiguration.getEndpoints())) {
            urlBuilder.append(datasourceConfiguration.getUrl());
        } else {
            urlBuilder.append("r2dbc:pool:mariadb://");
            final List<String> hosts = new ArrayList<>();

            if (!isSSHEnabled(datasourceConfiguration, CONNECTION_METHOD_INDEX)) {
                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    hosts.add(endpoint.getHost() + ":" + defaultIfNull(endpoint.getPort(), MYSQL_DEFAULT_PORT));
                }
            } else {
                hosts.add(LOCALHOST + ":"
                        + connectionContext
                                .getSshTunnelContext()
                                .getServerSocket()
                                .getLocalPort());
            }

            urlBuilder.append(String.join(",", hosts)).append("/");

            if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                urlBuilder.append(authentication.getDatabaseName());
            }
        }

        urlBuilder.append("?zeroDateTimeBehavior=convertToNull&allowMultiQueries=true");
        final List<Property> dsProperties = datasourceConfiguration.getProperties();

        if (!isEmpty(dsProperties)) {
            Property property = dsProperties.get(0);
            if (property != null
                    && "serverTimezone".equals(property.getKey())
                    && !StringUtils.isEmpty(property.getValue())) {
                urlBuilder.append("&serverTimezone=").append(property.getValue());
            }
        }

        ConnectionFactoryOptions baseOptions = ConnectionFactoryOptions.parse(urlBuilder.toString());
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder()
                .from(baseOptions)
                .option(ConnectionFactoryOptions.USER, authentication.getUsername())
                .option(ConnectionFactoryOptions.PASSWORD, authentication.getPassword());

        return ob;
    }

    public static ConnectionFactoryOptions.Builder addSslOptionsToBuilder(
            DatasourceConfiguration datasourceConfiguration, ConnectionFactoryOptions.Builder ob)
            throws AppsmithPluginException {
        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    MySQLErrorMessages.SSL_CONFIGURATION_FETCHING_ERROR_MSG);
        }

        /*
         * - By default, the driver configures SSL in the preferred mode.
         */
        SSLDetails.AuthType sslAuthType =
                datasourceConfiguration.getConnection().getSsl().getAuthType();
        switch (sslAuthType) {
            case REQUIRED:
                ob = ob.option(SSL, true)
                        .option(
                                Option.valueOf("sslMode"),
                                sslAuthType.toString().toLowerCase());

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
                        String.format(MySQLErrorMessages.UNEXPECTED_SSL_OPTION_ERROR_MSG, sslAuthType));
        }

        return ob;
    }

    public static Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
        Set<String> invalids = new HashSet<>();

        if (datasourceConfiguration.getConnection() != null
                && datasourceConfiguration.getConnection().getMode() == null) {
            invalids.add(MySQLErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG);
        }

        if (StringUtils.isEmpty(datasourceConfiguration.getUrl()) && isEmpty(datasourceConfiguration.getEndpoints())) {
            invalids.add(MySQLErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG);
        } else if (!isEmpty(datasourceConfiguration.getEndpoints())) {
            for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                if (endpoint.getHost() == null || endpoint.getHost().isBlank()) {
                    invalids.add(MySQLErrorMessages.DS_MISSING_HOSTNAME_ERROR_MSG);
                } else if (endpoint.getHost().contains("/")
                        || endpoint.getHost().contains(":")) {
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

            if (StringUtils.isEmpty(authentication.getPassword())
                    && StringUtils.isEmpty(authentication.getUsername())) {
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

        if (isSSHEnabled(datasourceConfiguration, CONNECTION_METHOD_INDEX)) {
            if (datasourceConfiguration.getSshProxy() == null
                    || isBlank(datasourceConfiguration.getSshProxy().getHost())) {
                invalids.add(DS_MISSING_SSH_HOSTNAME_ERROR_MSG);
            } else {
                String sshHost = datasourceConfiguration.getSshProxy().getHost();
                if (sshHost.contains("/") || sshHost.contains(":")) {
                    invalids.add(DS_INVALID_SSH_HOSTNAME_ERROR_MSG);
                }
            }

            if (isBlank(datasourceConfiguration.getSshProxy().getUsername())) {
                invalids.add(DS_MISSING_SSH_USERNAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getSshProxy().getPrivateKey() == null
                    || datasourceConfiguration.getSshProxy().getPrivateKey().getKeyFile() == null
                    || isBlank(datasourceConfiguration
                            .getSshProxy()
                            .getPrivateKey()
                            .getKeyFile()
                            .getBase64Content())) {
                invalids.add(DS_MISSING_SSH_KEY_ERROR_MSG);
            }
        }

        return invalids;
    }

    public static ConnectionPool getNewConnectionPool(
            DatasourceConfiguration datasourceConfiguration, ConnectionContext connectionContext)
            throws AppsmithPluginException {
        ConnectionFactoryOptions.Builder ob = getBuilder(datasourceConfiguration, connectionContext);
        ob = addSslOptionsToBuilder(datasourceConfiguration, ob);
        MariadbConnectionFactory connectionFactory =
                MariadbConnectionFactory.from(MariadbConnectionConfiguration.fromOptions(ob.build())
                        .allowPublicKeyRetrieval(true)
                        .build());

        /**
         * The pool configuration object does not seem to have any option to set the minimum pool size, hence could
         * not configure the minimum pool size.
         */
        ConnectionPoolConfiguration configuration = ConnectionPoolConfiguration.builder(connectionFactory)
                .maxIdleTime(MAX_IDLE_TIME)
                .maxSize(MAX_CONNECTION_POOL_SIZE)
                .backgroundEvictionInterval(BACKGROUND_EVICTION_TIME)
                .maxLifeTime(MAX_LIFE_TIME)
                .build();

        return new ConnectionPool(configuration);
    }
}
