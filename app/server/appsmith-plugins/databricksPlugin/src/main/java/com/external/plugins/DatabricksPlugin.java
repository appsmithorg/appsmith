package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_INVALID_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_NULL_ERROR_MSG;
import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static com.external.plugins.exceptions.DatabricksErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG;
import static com.external.plugins.exceptions.DatabricksPluginError.QUERY_EXECUTION_FAILED;
import java.util.TreeMap;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;

public class DatabricksPlugin extends BasePlugin {

    private static final String JDBC_DRIVER = "com.databricks.client.jdbc.Driver";
    private static final int VALIDITY_CHECK_TIMEOUT = 5;

    private static final String TABLES_QUERY =
            """
        SELECT TABLE_SCHEMA as schema_name, table_name,
        column_name, data_type, is_nullable,
        column_default
        FROM system.INFORMATION_SCHEMA.COLUMNS where table_schema <> 'information_schema'
        """;


    public DatabricksPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class DatabricksPluginExecutor implements PluginExecutor<Connection> {
        @Override
        public Mono<ActionExecutionResult> execute(
                Connection connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            try (Statement statement = connection.createStatement(); ) {
                String catalog =
                        (String) datasourceConfiguration.getProperties().get(2).getValue();
                if (!StringUtils.hasText(catalog)) {
                    catalog = "samples";
                }
                String useCatalogQuery = "USE CATALOG " + catalog;
                statement.execute(useCatalogQuery);
            } catch (SQLException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "The Appsmith server has failed to change the catalog.",
                        e.getMessage()));
            }

            try (Statement statement = connection.createStatement(); ) {
                String schema =
                        (String) datasourceConfiguration.getProperties().get(3).getValue();
                if (!StringUtils.hasText(schema)) {
                    schema = "default";
                }
                String useSchemaQuery = "USE SCHEMA " + schema;
                statement.execute(useSchemaQuery);
            } catch (SQLException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "The Appsmith server has failed to change the schema",
                        e.getMessage()));
            }


            String query = actionConfiguration.getBody();

            List<Map<String, Object>> rowsList = new ArrayList<>(50);
            final List<String> columnsList = new ArrayList<>();

            return (Mono<ActionExecutionResult>) Mono.fromCallable(() -> {
                        try {

                            // Check for connection validity :

                            if (connection == null) {
                                return Mono.error(new StaleConnectionException(CONNECTION_NULL_ERROR_MSG));
                            } else if (connection.isClosed()) {
                                return Mono.error(new StaleConnectionException(CONNECTION_CLOSED_ERROR_MSG));
                            } else if (!connection.isValid(VALIDITY_CHECK_TIMEOUT)) {
                                /**
                                 * Not adding explicit `!sqlConnectionFromPool.isValid(VALIDITY_CHECK_TIMEOUT)`
                                 * check here because this check may take few seconds to complete hence adding
                                 * extra time delay.
                                 */
                                return Mono.error(new StaleConnectionException(CONNECTION_INVALID_ERROR_MSG));
                            }

                        } catch (SQLException error) {
                            error.printStackTrace();
                            // This should not happen ideally.
                            System.out.println(
                                    "Error checking validity of Databricks connection : " + error.getMessage());
                        }

                        try {

                            // We can proceed since the connection is valid.

                            Statement statement = connection.createStatement();
                            ResultSet resultSet = statement.executeQuery(query);

                            ResultSetMetaData metaData = resultSet.getMetaData();
                            int colCount = metaData.getColumnCount();
                            columnsList.addAll(getColumnsListForJdbcPlugin(metaData));

                            while (resultSet.next()) {
                                // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                                Map<String, Object> row = new LinkedHashMap<>(colCount);

                                for (int i = 1; i <= colCount; i++) {
                                    Object value;
                                    final String typeName = metaData.getColumnTypeName(i);

                                    if (resultSet.getObject(i) == null) {
                                        value = null;
                                    } else {
                                        value = resultSet.getObject(i);
                                    }

                                    row.put(metaData.getColumnName(i), value);
                                }

                                rowsList.add(row);
                            }

                        } catch (SQLException e) {
                            return Mono.error(new AppsmithPluginException(
                                    QUERY_EXECUTION_FAILED,
                                    QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    e.getMessage(),
                                    "SQLSTATE: " + e.getSQLState()));

                        }

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setBody(objectMapper.valueToTree(rowsList));
                        result.setIsExecutionSuccess(true);
                        return Mono.just(result);
                    })
                    .flatMap(obj -> obj)
                    .subscribeOn(Schedulers.boundedElastic());
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            // Set up the connection URL
            StringBuilder urlBuilder = new StringBuilder("jdbc:databricks://");

            List<String> hosts = datasourceConfiguration.getEndpoints().stream()
                    .map(endpoint -> endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 443L))
                    .collect(Collectors.toList());

            urlBuilder.append(String.join(",", hosts)).append(";");

            String url = urlBuilder.toString();

            Properties p = new java.util.Properties();
            p.put("httpPath", datasourceConfiguration.getProperties().get(0).getValue());
            p.put("AuthMech", "3");
            p.put("UID", "token");
            p.put("PWD", datasourceConfiguration.getProperties().get(1).getValue());

            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                throw new RuntimeException(e);
            }

            return Mono.fromCallable(() -> DriverManager.getConnection(url, p));
        }

        @Override
        public void datasourceDestroy(Connection connection) {}

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceStructure> getStructure(
                Connection connection, DatasourceConfiguration datasourceConfiguration) {
            return Mono.fromSupplier(() -> {
                        final DatasourceStructure structure = new DatasourceStructure();
                        final Map<String, DatasourceStructure.Table> tablesByName =
                                new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

                        try (Statement statement = connection.createStatement();
                                ResultSet columnsResultSet = statement.executeQuery(TABLES_QUERY)) {

                            while (columnsResultSet.next()) {
                                final String schemaName = columnsResultSet.getString("schema_name");
                                final String tableName = columnsResultSet.getString("table_name");
                                final String fullTableName = schemaName + "." + tableName;
                                if (!tablesByName.containsKey(fullTableName)) {
                                    tablesByName.put(
                                            fullTableName,
                                            new DatasourceStructure.Table(
                                                    DatasourceStructure.TableType.TABLE,
                                                    schemaName,
                                                    fullTableName,
                                                    new ArrayList<>(),
                                                    new ArrayList<>(),
                                                    new ArrayList<>()));
                                }
                                final DatasourceStructure.Table table = tablesByName.get(fullTableName);
                                final String defaultExpr = columnsResultSet.getString("column_default");

                                table.getColumns()
                                        .add(new DatasourceStructure.Column(
                                                columnsResultSet.getString("column_name"),
                                                columnsResultSet.getString("data_type"),
                                                defaultExpr,
                                                null));
                            }
                            structure.setTables(new ArrayList<>(tablesByName.values()));
                            for (DatasourceStructure.Table table : structure.getTables()) {
                                table.getKeys().sort(Comparator.naturalOrder());
                            }
                            log.debug("Got the structure of Databricks DB");
                            return structure;
                        } catch (SQLException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                    "The Appsmith server has failed to fetch the structure of your schema.",
                                    e.getMessage(),
                                    "SQLSTATE: " + e.getSQLState()));
                        }
                    })
                    .map(resultStructure -> (DatasourceStructure) resultStructure)
                    .subscribeOn(Schedulers.boundedElastic());
        }
    }
}
