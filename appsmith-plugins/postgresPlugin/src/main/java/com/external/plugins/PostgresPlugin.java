package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
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

public class PostgresPlugin extends BasePlugin {

    static final String JDBC_DRIVER = "org.postgresql.Driver";

    private static final String USER = "user";
    private static final String PASSWORD = "password";
    private static final String SSL = "ssl";

    public PostgresPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /**
     * Postgres plugin receives the query as json of the following format :
     */

    @Slf4j
    @Extension
    public static class PostgresPluginExecutor implements PluginExecutor {

        @Override
        public Mono<Object> execute(@NonNull Object connection,
                                    DatasourceConfiguration datasourceConfiguration,
                                    ActionConfiguration actionConfiguration) {

            Connection conn = (Connection) connection;

            String query = actionConfiguration.getBody();

            if (query == null) {
                return pluginErrorMono("Missing required parameter: Query.");
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
                return pluginErrorMono(e.getMessage());

            } finally {
                if (resultSet != null) {
                    try {
                        resultSet.close();
                    } catch (SQLException e) {
                        log.warn("Error closing Postgres ResultSet", e);
                    }
                }

                if (statement != null) {
                    try {
                        statement.close();
                    } catch (SQLException e) {
                        log.warn("Error closing Postgres Statement", e);
                    }
                }

            }

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(objectMapper.valueToTree(rowsList));
            result.setIsExecutionSuccess(true);
            log.debug("In the PostgresPlugin, got action execution result: " + result.toString());
            return Mono.just(result);
        }

        private Mono<Object> pluginErrorMono(Object... args) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, args));
        }

        @Override
        public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                return pluginErrorMono("Error loading Postgres JDBC Driver class.");
            }

            String url;
            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();

            com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();

            final boolean isSslEnabled = configurationConnection != null
                    && configurationConnection.getSsl() != null
                    && !SSLDetails.AuthType.NO_SSL.equals(configurationConnection.getSsl().getAuthType());

            Properties properties = new Properties();
            properties.putAll(Map.of(
                    USER, authentication.getUsername(),
                    PASSWORD, authentication.getPassword(),
                    // TODO: Set SSL connection parameters.
                    SSL, isSslEnabled
            ));

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                url = datasourceConfiguration.getUrl();

            } else {
                StringBuilder urlBuilder = new StringBuilder("jdbc:postgresql://");
                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    urlBuilder
                            .append(endpoint.getHost())
                            .append(':')
                            .append(ObjectUtils.defaultIfNull(endpoint.getPort(), 5432L))
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
                return pluginErrorMono("Error connecting to Postgres.", e);

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
                log.error("Error closing Postgres Connection.", e);
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
                    invalids.add("Missing database name.");
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
                            log.warn("Error closing Postgres connection that was made for testing.", e);
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

    }

}
