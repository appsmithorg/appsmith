package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static com.appsmith.external.models.Connection.Mode.READ_ONLY;

public class MySqlPlugin extends BasePlugin {

    static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";

    private static final String USER = "user";
    private static final String PASSWORD = "password";
    private static final int VALIDITY_CHECK_TIMEOUT = 5;

    public MySqlPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class MySqlPluginExecutor implements PluginExecutor {

        @Override
        public Mono<ActionExecutionResult> execute(Object connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            Connection conn = (Connection) connection;

            try {
                if (conn == null || conn.isClosed() || !conn.isValid(VALIDITY_CHECK_TIMEOUT)) {
                    log.info("Encountered stale connection in MySQL plugin. Reporting back.");
                    throw new StaleConnectionException();
                }
            } catch (SQLException error) {
                // This exception is thrown only when the timeout to `isValid` is negative. Since, that's not the case,
                // here, this should never happen.
                log.error("Error checking validity of MySQL connection.", error);
            }

            String query = actionConfiguration.getBody();

            if (query == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required parameter: Query."));
            }

            List<Map<String, Object>> rowsList = new ArrayList<>(50);

            Statement statement = null;
            ResultSet resultSet = null;
            try {
                statement = conn.createStatement();
                boolean isResultSet = statement.execute(query);

                if (isResultSet) {
                    resultSet = statement.getResultSet();
                    ResultSetMetaData metaData = resultSet.getMetaData();
                    int colCount = metaData.getColumnCount();
                    while (resultSet.next()) {
                        Map<String, Object> row = new HashMap<>(colCount);
                        for (int i = 1; i <= colCount; i++) {
                            row.put(metaData.getColumnName(i), resultSet.getObject(i));
                        }
                        rowsList.add(row);
                    }

                } else {
                    rowsList.add(Map.of("affectedRows", statement.getUpdateCount()));

                }

            } catch (SQLException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));

            } finally {
                if (resultSet != null) {
                    try {
                        resultSet.close();
                    } catch (SQLException e) {
                        log.warn("Error closing MySQL ResultSet", e);
                    }
                }

                if (statement != null) {
                    try {
                        statement.close();
                    } catch (SQLException e) {
                        log.warn("Error closing MySQL Statement", e);
                    }
                }

            }

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(objectMapper.valueToTree(rowsList));
            result.setIsExecutionSuccess(true);
            log.debug("In the MySqlPlugin, got action execution result: " + result.toString());
            return Mono.just(result);
        }

        @Override
        public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Error loading MySQL JDBC Driver class."));
            }

            String url;
            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();

            com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();

            Properties properties = new Properties();
            properties.putAll(Map.of(
                    USER, authentication.getUsername(),
                    PASSWORD, authentication.getPassword()
                    // TODO: Set SSL connection parameters.
            ));

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                url = datasourceConfiguration.getUrl();

            } else {
                StringBuilder urlBuilder = new StringBuilder("jdbc:mysql://");
                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    urlBuilder
                            .append(endpoint.getHost())
                            .append(':')
                            .append(ObjectUtils.defaultIfNull(endpoint.getPort(), 3306L))
                            .append('/');

                    if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                        urlBuilder.append(authentication.getDatabaseName());
                    }
                }
                url = urlBuilder.toString();
            }

            try {
                Connection connection = DriverManager.getConnection(url, properties);
                connection.setReadOnly(
                        configurationConnection != null && READ_ONLY.equals(configurationConnection.getMode()));
                return Mono.just(connection);
            } catch (SQLException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Error connecting to MySQL: " + e.getMessage(), e));
            }
        }

        @Override
        public void datasourceDestroy(Object connection) {
            Connection conn = (Connection) connection;
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException e) {
                log.error("Error closing MySQL Connection.", e);
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {

            Set<String> invalids = new HashSet<>();

            if (datasourceConfiguration.getConnection() != null
                    && datasourceConfiguration.getConnection().getMode() == null) {
                invalids.add("Missing Connection Mode.");
            }

            if (StringUtils.isEmpty(datasourceConfiguration.getUrl()) &&
                CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                    invalids.add("Missing endpoint and url");
            }

            if (datasourceConfiguration.getAuthentication() == null) {
                invalids.add("Missing authentication details.");
            } else {
                if (StringUtils.isEmpty(datasourceConfiguration.getAuthentication().getUsername())) {
                    invalids.add("Missing username for authentication.");
                }

                if (StringUtils.isEmpty(datasourceConfiguration.getAuthentication().getPassword())) {
                    invalids.add("Missing password for authentication.");
                }

                if (StringUtils.isEmpty(datasourceConfiguration.getAuthentication().getDatabaseName())) {
                    invalids.add("Missing database name");
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
                                ((Connection) connection).close();
                            }
                        } catch (SQLException e) {
                            log.warn("Error closing MySQL connection that was made for testing.", e);
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }
    }
}
