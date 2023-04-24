package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.pool.HikariPool;
import org.apache.commons.lang.ObjectUtils;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.apache.commons.lang3.StringUtils.isBlank;

public class OracleDatasourceUtils {
    public static final int MINIMUM_POOL_SIZE = 1;
    public static final int MAXIMUM_POOL_SIZE = 5;
    public static final long LEAK_DETECTION_TIME_MS = 60 * 1000;
    public static final String JDBC_DRIVER = "oracle.jdbc.driver.OracleDriver";
    public static final String ORACLE_URL_PREFIX = "jdbc:oracle:thin:@tcp://";
    public static final int ORACLE_URL_PREFIX_TCPS_OFFSET = 21;

    public static void datasourceDestroy(HikariDataSource connection) {
        if (connection != null) {
            System.out.println(Thread.currentThread().getName() + ": Closing Oracle DB Connection Pool");
            connection.close();
        }
    }

    public static Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
        Set<String> invalids = new HashSet<>();

        if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
            invalids.add("Missing endpoint.");
        } else {
            for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                if (isBlank(endpoint.getHost())) {
                    invalids.add("Missing hostname.");
                } else if (endpoint.getHost().contains("/") || endpoint.getHost().contains(":")) {
                    invalids.add("Host value cannot contain `/` or `:` characters. Found `" + endpoint.getHost() + "`.");
                }
            }
        }

        if (datasourceConfiguration.getAuthentication() == null) {
            invalids.add("Missing authentication details.");

        } else {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (isBlank(authentication.getUsername())) {
                invalids.add("Missing username for authentication.");
            }

            if (isBlank(authentication.getDatabaseName())) {
                invalids.add("Missing database name.");
            }
        }

        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            invalids.add("Appsmith server has failed to fetch SSL configuration from datasource configuration form. " +
                    "Please reach out to Appsmith customer support to resolve this.");
        }

        return invalids;
    }

    public static Mono<DatasourceStructure> getStructure(HikariDataSource connection,
                                                   DatasourceConfiguration datasourceConfiguration) {
        // Next TBD: fill it
        return Mono.just(new DatasourceStructure());
    }

    public static HikariDataSource createConnectionPool(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
        HikariConfig config = new HikariConfig();

        config.setDriverClassName(JDBC_DRIVER);

        config.setMinimumIdle(MINIMUM_POOL_SIZE);
        config.setMaximumPoolSize(MAXIMUM_POOL_SIZE);

        // Set authentication properties
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        if (!isBlank(authentication.getUsername())) {
            config.setUsername(authentication.getUsername());
        }
        if (!isBlank(authentication.getPassword())) {
            config.setPassword(authentication.getPassword());
        }

        // Set up the connection URL
        StringBuilder urlBuilder = new StringBuilder(ORACLE_URL_PREFIX);

        List<String> hosts = datasourceConfiguration
                .getEndpoints()
                .stream()
                .map(endpoint -> endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 1521L))
                .collect(Collectors.toList());

        urlBuilder.append(String.join(",", hosts)).append("/");

        if (!isBlank(authentication.getDatabaseName())) {
            urlBuilder.append(authentication.getDatabaseName());
        }

        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server has failed to fetch SSL configuration from datasource configuration form. " +
                            "Please reach out to Appsmith customer support to resolve this."
            );
        }

        SSLDetails.AuthType sslAuthType = datasourceConfiguration.getConnection().getSsl().getAuthType();
        switch (sslAuthType) {
            case DISABLE:
                /* do nothing */

                break;
            case NO_VERIFY:
                /* convert tcp to tcps in the URL */
                urlBuilder.insert(ORACLE_URL_PREFIX_TCPS_OFFSET, 's');

                break;
            default:
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server has found an unexpected SSL option: " + sslAuthType + ". Please reach out to" +
                                " Appsmith customer support to resolve this."
                );
        }

        String url = urlBuilder.toString();
        config.setJdbcUrl(url);

        // Configuring leak detection threshold for 60 seconds. Any connection which hasn't been released in 60 seconds
        // should get tracked (may be falsely for long running queries) as leaked connection
        config.setLeakDetectionThreshold(LEAK_DETECTION_TIME_MS);

        // Now create the connection pool from the configuration
        HikariDataSource datasource = null;
        try {
            datasource = new HikariDataSource(config);
        } catch (HikariPool.PoolInitializationException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    e.getMessage()
            );
        }

        return datasource;
    }

    /**
     * First checks if the connection pool is still valid. If yes, we fetch a connection from the pool and return
     * In case a connection is not available in the pool, SQL Exception is thrown
     */
    public static java.sql.Connection getConnectionFromConnectionPool(HikariDataSource connectionPool) throws SQLException {

        if (connectionPool == null || connectionPool.isClosed() || !connectionPool.isRunning()) {
            System.out.println(Thread.currentThread().getName() +
                    ": Encountered stale connection pool in Oracle plugin. Reporting back.");
            throw new StaleConnectionException();
        }

        return connectionPool.getConnection();
    }
}
