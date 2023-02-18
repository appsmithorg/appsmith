package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.exceptions.RedshiftErrorMessages;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.pool.HikariPool;
import org.apache.commons.lang.ObjectUtils;
import org.springframework.util.StringUtils;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.stream.Collectors;

import static com.external.plugins.RedshiftPlugin.JDBC_DRIVER;

public class RedshiftDatasourceUtils {

    private static final int MINIMUM_POOL_SIZE = 1;
    private static final int MAXIMUM_POOL_SIZE = 5;
    private static final long LEAK_DETECTION_TIME_MS = 60 * 1000;
    private static final String JDBC_PROTOCOL = "jdbc:redshift://";


    public static HikariDataSource createConnectionPool(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
        HikariConfig config = new HikariConfig();

        config.setDriverClassName(JDBC_DRIVER);
        config.setMinimumIdle(MINIMUM_POOL_SIZE);
        config.setMaximumPoolSize(MAXIMUM_POOL_SIZE);

        // Set authentication properties
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        if (authentication.getUsername() != null) {
            config.setUsername(authentication.getUsername());
        }
        if (authentication.getPassword() != null) {
            config.setPassword(authentication.getPassword());
        }

        // Set up the connection URL
        StringBuilder urlBuilder = new StringBuilder(JDBC_PROTOCOL);

        List<String> hosts = datasourceConfiguration
                .getEndpoints()
                .stream()
                .map(endpoint -> endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 5439L))
                .collect(Collectors.toList());

        urlBuilder.append(String.join(",", hosts)).append("/");

        if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
            urlBuilder.append(authentication.getDatabaseName());
        }

        String url = urlBuilder.toString();
        config.setJdbcUrl(url);

        // Configuring leak detection threshold for 60 seconds. Any connection which hasn't been released in 60 seconds
        // should get tracked (may be falsely for long running queries) as leaked connection
        config.setLeakDetectionThreshold(LEAK_DETECTION_TIME_MS);
        config.setConnectionTimeout(60 * 1000);

        // Set read only mode if applicable
        com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();
        switch (configurationConnection.getMode()) {
            case READ_WRITE: {
                config.setReadOnly(false);
                break;
            }
            case READ_ONLY: {
                config.setReadOnly(true);
                config.addDataSourceProperty("readOnlyMode", "always");
                break;
            }
        }

        // Now create the connection pool from the configuration
        HikariDataSource datasource = null;
        try {
            datasource = new HikariDataSource(config);
        } catch (HikariPool.PoolInitializationException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    RedshiftErrorMessages.CONNECTION_POOL_CREATION_FAILED_ERROR_MSG,
                    e.getMessage()
            );
        }

        return datasource;
    }

    public static Connection getConnectionFromConnectionPool(HikariDataSource connectionPool) throws SQLException {

        if (connectionPool == null || connectionPool.isClosed() || !connectionPool.isRunning()) {
            System.out.println(Thread.currentThread().getName() +
                    ": Encountered stale connection pool in Redshift plugin. Reporting back.");
            throw new StaleConnectionException();
        }

        return connectionPool.getConnection();
    }
}
