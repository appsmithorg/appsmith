package com.external.plugins;

import com.appsmith.external.models.*;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static com.appsmith.external.models.Connection.Mode.READ_ONLY;

public class MySqlPlugin extends BasePlugin {

    static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";

    private static final String USER = "user";
    private static final String PASSWORD = "password";

    public MySqlPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    public static class PostgresPluginExecutor implements PluginExecutor {

        private Mono<Object> pluginErrorMono(Object... args) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, args));
        }

        @Override
        public Mono<Object> execute(Object connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            return null;
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
                return pluginErrorMono("Error connecting to MySql.", e);

            }

        }

        @Override
        public void datasourceDestroy(Object connection) {

        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }
    }
}
