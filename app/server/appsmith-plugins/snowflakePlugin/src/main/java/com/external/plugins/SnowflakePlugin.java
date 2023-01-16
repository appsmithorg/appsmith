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
import com.external.plugins.exceptions.SnowflakeErrorMessages;
import com.external.plugins.exceptions.SnowflakePluginError;
import com.external.utils.SqlUtils;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static com.external.utils.ExecutionUtils.getRowsFromQueryResult;
import static com.external.utils.ValidationUtils.validateWarehouseDatabaseSchema;

@Slf4j
public class SnowflakePlugin extends BasePlugin {

    public SnowflakePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class SnowflakePluginExecutor implements PluginExecutor<Connection> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {

            String query = actionConfiguration.getBody();

            if (! StringUtils.hasLength(query)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SnowflakeErrorMessages.MISSING_QUERY_ERROR_MSG));
            }

            return Mono
                    .fromCallable(() -> {
                        try {
                            // Connection staleness is checked as part of this method call.
                            return getRowsFromQueryResult(connection, query);
                        } catch (AppsmithPluginException | StaleConnectionException e) {
                            throw e;
                        }
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
                log.debug("Driver not found");
                return Mono.error(new AppsmithPluginException(SnowflakePluginError.SNOWFLAKE_PLUGIN_ERROR, SnowflakeErrorMessages.DRIVER_NOT_FOUND_ERROR_MSG, ex.getMessage()));
            }
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            Properties properties = new Properties();
            properties.setProperty("user", authentication.getUsername());
            properties.setProperty("password", authentication.getPassword());
            properties.setProperty("warehouse", String.valueOf(datasourceConfiguration.getProperties().get(0).getValue()));
            properties.setProperty("db", String.valueOf(datasourceConfiguration.getProperties().get(1).getValue()));
            properties.setProperty("schema", String.valueOf(datasourceConfiguration.getProperties().get(2).getValue()));
            properties.setProperty("role", String.valueOf(datasourceConfiguration.getProperties().get(3).getValue()));

            return Mono
                    .fromCallable(() -> {
                        Connection conn;
                        try {
                            conn = DriverManager.getConnection("jdbc:snowflake://" + datasourceConfiguration.getUrl() + ".snowflakecomputing.com", properties);
                        } catch (SQLException e) {
                            log.error("Exception caught when connecting to Snowflake endpoint: " + datasourceConfiguration.getUrl() + ". Cause: ", e);
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, String.format(SnowflakeErrorMessages.CONNECTION_CREATION_FAILED_ERROR_MSG, datasourceConfiguration.getUrl()), e.getMessage());
                        }
                        if (conn == null) {
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, SnowflakeErrorMessages.UNABLE_TO_CREATE_CONNECTION_ERROR_MSG);
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
                    log.error("Exception caught when closing Snowflake connection. Cause: ", throwable);
                }
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (StringUtils.isEmpty(datasourceConfiguration.getUrl())) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG);
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 1
                    || datasourceConfiguration.getProperties().get(0) == null
                    || datasourceConfiguration.getProperties().get(0).getValue() == null
                    || StringUtils.isEmpty(String.valueOf(datasourceConfiguration.getProperties().get(0).getValue())))) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_WAREHOUSE_NAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 2
                    || datasourceConfiguration.getProperties().get(1) == null
                    || datasourceConfiguration.getProperties().get(1).getValue() == null
                    || StringUtils.isEmpty(String.valueOf(datasourceConfiguration.getProperties().get(1).getValue())))) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_DATABASE_NAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 3
                    || datasourceConfiguration.getProperties().get(2) == null
                    || datasourceConfiguration.getProperties().get(2).getValue() == null
                    || StringUtils.isEmpty(String.valueOf(datasourceConfiguration.getProperties().get(2).getValue())))) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_SCHEMA_NAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getAuthentication() == null) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG);
            } else {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add(SnowflakeErrorMessages.DS_MISSING_USERNAME_ERROR_MSG);
                }

                if (StringUtils.isEmpty(authentication.getPassword())) {
                    invalids.add(SnowflakeErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG);
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(Connection connection) {
            return Mono.fromCallable(() -> {
                        return validateWarehouseDatabaseSchema(connection);
                    })
                    .map(DatasourceTestResult::new);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Connection connection, DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            return Mono
                    .fromSupplier(() -> {
                        try {
                            // Connection staleness is checked as part of this method call.
                            Set<String> invalids = validateWarehouseDatabaseSchema(connection);
                            if (!invalids.isEmpty()) {
                                throw new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                        invalids.toArray()[0]
                                );
                            }
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
                        } catch (SQLException throwable) {
                            log.error("Exception caught while fetching structure of Snowflake datasource. Cause: ", throwable);
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, SnowflakeErrorMessages.GET_STRUCTURE_ERROR_MSG, throwable.getMessage(), "SQLSTATE: " + throwable.getSQLState());
                        }
                        return structure;
                    })
                    .subscribeOn(scheduler);
        }
    }
}
