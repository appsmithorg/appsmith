package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.models.Connection.Mode.READ_ONLY;

public class MssqlPlugin extends BasePlugin {

    private static final String JDBC_DRIVER = "com.microsoft.sqlserver.jdbc.SQLServerDriver";

    private static final int VALIDITY_CHECK_TIMEOUT = 5;

    private static final String DATE_COLUMN_TYPE_NAME = "date";

    public MssqlPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /**
     * MsSQL plugin receives the query as json of the following format :
     */

    @Slf4j
    @Extension
    public static class MssqlPluginExecutor implements PluginExecutor<Connection> {

        private final Scheduler scheduler = Schedulers.elastic();

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            return (Mono<ActionExecutionResult>) Mono.fromCallable(() -> {
                try {
                    if (connection == null || connection.isClosed() || !connection.isValid(VALIDITY_CHECK_TIMEOUT)) {
                        log.info("Encountered stale connection in MsSQL plugin. Reporting back.");
                        return Mono.error(new StaleConnectionException());
                    }
                } catch (SQLException error) {
                    // This exception is thrown only when the timeout to `isValid` is negative. Since, that's not the case,
                    // here, this should never happen.
                    log.error("Error checking validity of MsSQL connection.", error);
                }

                String query = actionConfiguration.getBody();

                if (query == null) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Missing required " +
                            "parameter: Query."));
                }

                List<Map<String, Object>> rowsList = new ArrayList<>(50);

                Statement statement = null;
                ResultSet resultSet = null;
                try {
                    statement = connection.createStatement();
                    boolean isResultSet = statement.execute(query);

                    if (isResultSet) {
                        resultSet = statement.getResultSet();
                        ResultSetMetaData metaData = resultSet.getMetaData();
                        int colCount = metaData.getColumnCount();

                        while (resultSet.next()) {
                            // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                            Map<String, Object> row = new LinkedHashMap<>(colCount);

                            for (int i = 1; i <= colCount; i++) {
                                Object value;
                                final String typeName = metaData.getColumnTypeName(i);

                                if (resultSet.getObject(i) == null) {
                                    value = null;

                                } else if (DATE_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    value = DateTimeFormatter.ISO_DATE.format(resultSet.getDate(i).toLocalDate());

                                } else if ("timestamp".equalsIgnoreCase(typeName)) {
                                    value = DateTimeFormatter.ISO_DATE_TIME.format(
                                            LocalDateTime.of(
                                                    resultSet.getDate(i).toLocalDate(),
                                                    resultSet.getTime(i).toLocalTime()
                                            )
                                    ) + "Z";

                                } else if ("timestamptz".equalsIgnoreCase(typeName)) {
                                    value = DateTimeFormatter.ISO_DATE_TIME.format(
                                            resultSet.getObject(i, OffsetDateTime.class)
                                    );

                                } else if ("time".equalsIgnoreCase(typeName) || "timetz".equalsIgnoreCase(typeName)) {
                                    value = resultSet.getString(i);

                                } else if ("interval".equalsIgnoreCase(typeName)) {
                                    value = resultSet.getObject(i).toString();

                                } else {
                                    value = resultSet.getObject(i);

                                }

                                row.put(metaData.getColumnName(i), value);
                            }

                            rowsList.add(row);
                        }

                    } else {
                        rowsList.add(Map.of(
                                "affectedRows",
                                ObjectUtils.defaultIfNull(statement.getUpdateCount(), 0))
                        );

                    }

                } catch (SQLException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, e.getMessage()));

                } finally {
                    if (resultSet != null) {
                        try {
                            resultSet.close();
                        } catch (SQLException e) {
                            log.warn("Error closing MsSQL ResultSet", e);
                        }
                    }

                    if (statement != null) {
                        try {
                            statement.close();
                        } catch (SQLException e) {
                            log.warn("Error closing MsSQL Statement", e);
                        }
                    }

                }

                ActionExecutionResult result = new ActionExecutionResult();
                result.setBody(objectMapper.valueToTree(rowsList));
                result.setIsExecutionSuccess(true);
                System.out.println(Thread.currentThread().getName() + ": In the MssqlPlugin, got action execution result");
                return Mono.just(result);
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return (Mono<Connection>) Mono.fromCallable(() -> {
                try {
                    Class.forName(JDBC_DRIVER);
                } catch (ClassNotFoundException e) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Error loading MsSQL JDBC Driver class."
                    ));
                }

                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

                com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();

                final boolean isSslEnabled = configurationConnection != null
                        && configurationConnection.getSsl() != null
                        && !SSLDetails.AuthType.NO_SSL.equals(configurationConnection.getSsl().getAuthType());

                StringBuilder urlBuilder = new StringBuilder("jdbc:sqlserver://");
                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    urlBuilder
                            .append(endpoint.getHost())
                            .append(":")
                            .append(ObjectUtils.defaultIfNull(endpoint.getPort(), 5432L))
                            .append(";");
                }

                if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                    urlBuilder
                            .append("database=")
                            .append(authentication.getDatabaseName())
                            .append(";");
                }

                if (!StringUtils.isEmpty(authentication.getUsername())) {
                    urlBuilder
                            .append("user=")
                            .append(authentication.getUsername())
                            .append(";");
                }

                if (!StringUtils.isEmpty(authentication.getPassword())) {
                    urlBuilder
                            .append("password=")
                            .append(authentication.getPassword())
                            .append(";");
                }

                urlBuilder
                        .append("encrypt=")
                        .append(isSslEnabled)
                        .append(";");

                try {
                    Connection connection = DriverManager.getConnection(urlBuilder.toString());
                    connection.setReadOnly(
                            configurationConnection != null && READ_ONLY.equals(configurationConnection.getMode()));
                    System.out.println(Thread.currentThread().getName() + ": Connected to MS-SQL Database");
                    return Mono.just(connection);

                } catch (SQLException e) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Error connecting to MsSQL: " + e.getMessage()
                    ));
                }
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(Connection connection) {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                log.error("Error closing MsSQL Connection.", e);
            }
        }

        @Override
        public Set<String> validateDatasource(@NonNull DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add("Missing endpoint.");
            }

            if (datasourceConfiguration.getConnection() != null
                    && datasourceConfiguration.getConnection().getMode() == null) {
                invalids.add("Missing Connection Mode.");
            }

            DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
            if (auth == null) {
                invalids.add("Missing authentication details.");

            } else {
                if (StringUtils.isEmpty(auth.getUsername())) {
                    invalids.add("Missing username for authentication.");
                }

                if (StringUtils.isEmpty(auth.getPassword())) {
                    invalids.add("Missing password for authentication.");
                }

            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .map(connection -> {
                        try {
                            if (connection != null) {
                                connection.close();
                            }
                        } catch (SQLException e) {
                            log.warn("Error closing MsSQL connection that was made for testing.", e);
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

    }

}
