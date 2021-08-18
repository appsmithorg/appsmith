package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.external.utils.SqlUtils;
import lombok.extern.slf4j.Slf4j;
import net.snowflake.client.jdbc.SnowflakeReauthenticationRequest;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

public class SnowflakePlugin extends BasePlugin {

    public SnowflakePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class SnowflakePluginExecutor implements PluginExecutor<Connection> {

        private final Scheduler scheduler = Schedulers.elastic();

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {

            String query = actionConfiguration.getBody();

            if (query == null) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Missing required parameter: Query."));
            }

            return Mono
                    .fromCallable(() -> {
                        ResultSet resultSet = null;
                        List<Map<String, Object>> rowsList = new ArrayList<>(50);
                        try {
                            // We do not use keep alive threads for our connections since these might become expensive
                            // Instead for every execution, we check for connection validity,
                            // and reset the connection if required
                            if (!connection.isValid(30)) {
                                throw new StaleConnectionException();
                            }

                            Statement statement = connection.createStatement();
                            resultSet = statement.executeQuery(query);
                            ResultSetMetaData metaData = resultSet.getMetaData();
                            int colCount = metaData.getColumnCount();

                            while (resultSet.next()) {
                                // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                                Map<String, Object> row = new LinkedHashMap<>(colCount);

                                for (int i = 1; i <= colCount; i++) {
                                    Object value = resultSet.getObject(i);
                                    row.put(metaData.getColumnName(i), value);
                                }
                                rowsList.add(row);
                            }
                        } catch (SQLException e) {
                            if (e instanceof SnowflakeReauthenticationRequest) {
                                throw new StaleConnectionException();
                            }
                            e.printStackTrace();
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, e.getMessage());
                        } finally {
                            if (resultSet != null) {
                                try {
                                    resultSet.close();
                                } catch (SQLException e) {
                                    e.printStackTrace();
                                }
                            }
                        }
                        return rowsList;
                    })
                    .map(rowsList -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setBody(objectMapper.valueToTree(rowsList));
                        result.setIsExecutionSuccess(true);
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(query);
                        result.setRequest(request);
                        return result;
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName("net.snowflake.client.jdbc.SnowflakeDriver");
            } catch (ClassNotFoundException ex) {
                System.err.println("Driver not found");
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, ex.getMessage()));
            }
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            Properties properties = new Properties();
            properties.setProperty("user", authentication.getUsername());
            properties.setProperty("password", authentication.getPassword());
            properties.setProperty("warehouse", String.valueOf(datasourceConfiguration.getProperties().get(0).getValue()));
            properties.setProperty("db", String.valueOf(datasourceConfiguration.getProperties().get(1).getValue()));
            properties.setProperty("role", String.valueOf(datasourceConfiguration.getProperties().get(3).getValue()));

            return Mono
                    .fromCallable(() -> {
                        Connection conn;
                        try {
                            conn = DriverManager.getConnection("jdbc:snowflake://" + datasourceConfiguration.getUrl() + ".snowflakecomputing.com", properties);
                        } catch (SQLException e) {
                            e.printStackTrace();
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, e.getMessage());
                        }
                        if (conn == null) {
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create connection to Snowflake URL");
                        }
                        return conn;
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(Connection connection) {
            if (connection != null) {
                try {
                    connection.close();
                } catch (SQLException throwable) {
                    throwable.printStackTrace();
                }
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (StringUtils.isEmpty(datasourceConfiguration.getUrl())) {
                invalids.add("Missing Snowflake URL.");
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 1
                    || datasourceConfiguration.getProperties().get(0) == null
                    || datasourceConfiguration.getProperties().get(0).getValue() == null
                    || StringUtils.isEmpty(String.valueOf(datasourceConfiguration.getProperties().get(0).getValue())))) {
                invalids.add("Missing warehouse name.");
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 2
                    || datasourceConfiguration.getProperties().get(1) == null
                    || datasourceConfiguration.getProperties().get(1).getValue() == null
                    || StringUtils.isEmpty(String.valueOf(datasourceConfiguration.getProperties().get(1).getValue())))) {
                invalids.add("Missing database name.");
            }

            if (datasourceConfiguration.getAuthentication() == null) {
                invalids.add("Missing authentication details.");
            } else {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add("Missing username for authentication.");
                }

                if (StringUtils.isEmpty(authentication.getPassword())) {
                    invalids.add("Missing password for authentication.");
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .flatMap(connection -> {
                        if (connection != null) {
                            try {
                                connection.close();
                            } catch (SQLException throwable) {
                                throwable.printStackTrace();
                                return Mono.error(throwable);
                            }
                        }

                        return Mono.just(new DatasourceTestResult());
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Connection connection, DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            return Mono
                    .fromSupplier(() -> {
                        try {
                            if (connection.isValid(30)) {
                                Statement statement = connection.createStatement();
                                final String columnsQuery = SqlUtils.COLUMNS_QUERY + "'"
                                        + datasourceConfiguration.getProperties().get(2).getValue() + "'";
                                ResultSet resultSet = statement.executeQuery(columnsQuery);

                                while (resultSet.next()) {
                                    SqlUtils.getTableInfo(resultSet, tablesByName);
                                }

                                resultSet = statement.executeQuery(SqlUtils.PRIMARY_KEYS_QUERY);
                                while (resultSet.next()) {
                                    SqlUtils.getPrimaryKeyInfo(resultSet, tablesByName, keyRegistry);
                                }

                                resultSet = statement.executeQuery(SqlUtils.FOREIGN_KEYS_QUERY);
                                while (resultSet.next()) {
                                    SqlUtils.getForeignKeyInfo(resultSet, tablesByName, keyRegistry);
                                }

                                /* Get templates for each table and put those in. */
                                SqlUtils.getTemplates(tablesByName);
                                structure.setTables(new ArrayList<>(tablesByName.values()));
                                for (DatasourceStructure.Table table : structure.getTables()) {
                                    table.getKeys().sort(Comparator.naturalOrder());
                                }
                            } else {
                                throw new StaleConnectionException();
                            }
                        } catch (SQLException throwable) {
                            throwable.printStackTrace();
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, throwable.getMessage());
                        }
                        return structure;
                    })
                    .subscribeOn(scheduler);
        }
    }
}
