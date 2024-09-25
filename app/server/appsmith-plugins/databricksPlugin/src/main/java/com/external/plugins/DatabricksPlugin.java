package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.BearerTokenAuth;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_INVALID_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_NULL_ERROR_MSG;
import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static com.external.plugins.exceptions.DatabricksErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG;
import static com.external.plugins.exceptions.DatabricksPluginError.QUERY_EXECUTION_FAILED;

public class DatabricksPlugin extends BasePlugin {

    private static final String JDBC_DRIVER = "com.databricks.client.jdbc.Driver";
    public static final int VALIDITY_CHECK_TIMEOUT = 5;
    private static final int INITIAL_ROWLIST_CAPACITY = 50;
    private static final int CATALOG_INDEX = 2;
    private static final int SCHEMA_INDEX = 3;
    private static final int CONFIGURATION_TYPE_INDEX = 0;
    private static final int JDBC_URL_INDEX = 5;
    private static final long DEFAULT_PORT = 443L;
    private static final int HTTP_PATH_INDEX = 1;
    private static final int USER_AGENT_TAG = 4;
    private static final String FORM_PROPERTIES_CONFIGURATION = "FORM_PROPERTIES_CONFIGURATION";
    private static final String JDBC_URL_CONFIGURATION = "JDBC_URL_CONFIGURATION";

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

            log.debug(Thread.currentThread().getName() + ": execute() called for Databricks plugin.");
            String query = actionConfiguration.getBody();

            List<Map<String, Object>> rowsList = new ArrayList<>(INITIAL_ROWLIST_CAPACITY);
            final List<String> columnsList = new ArrayList<>();

            return (Mono<ActionExecutionResult>) Mono.fromCallable(() -> {
                        log.debug(Thread.currentThread().getName()
                                + ": creating action execution result from Databricks plugin.");
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
                            log.error("Error checking validity of Databricks connection : " + error.getMessage());
                        }

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(true);

                        try {

                            // We can proceed since the connection is valid.
                            Statement statement = connection.createStatement();
                            boolean hasResultSet = statement.execute(query);

                            if (!hasResultSet) {
                                // This must be an update/delete/insert kind of query which did not return any results.
                                // Lets set sample response and return back.
                                Map<String, Object> successResponse = Map.of("success", true);
                                result.setBody(objectMapper.valueToTree(successResponse));
                                return Mono.just(result);
                            }

                            ResultSet resultSet = statement.getResultSet();

                            ResultSetMetaData metaData = resultSet.getMetaData();
                            int colCount = metaData.getColumnCount();
                            columnsList.addAll(getColumnsListForJdbcPlugin(metaData));

                            while (resultSet.next()) {
                                // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                                Map<String, Object> row = new LinkedHashMap<>(colCount);

                                for (int i = 1; i <= colCount; i++) {
                                    Object value;

                                    Object resultSetObject = resultSet.getObject(i);
                                    if (resultSetObject == null) {
                                        value = null;
                                    } else {
                                        value = resultSetObject;
                                    }

                                    row.put(metaData.getColumnName(i), value);
                                }

                                rowsList.add(row);
                            }

                        } catch (SQLException e) {

                            String sqlState = e.getSQLState();
                            // Databricks returns true on isValid check even if the connection is stale.
                            // This scenario in particular happens when the connection was established before
                            // the cluster restarts. The sql state here corresponds to bad connection link
                            // and hence the correct action is to throw a StaleConnectionException.
                            if (sqlState != null && sqlState.equals("08S01")) {
                                return Mono.error(new StaleConnectionException(CONNECTION_CLOSED_ERROR_MSG));
                            }

                            return Mono.error(new AppsmithPluginException(
                                    QUERY_EXECUTION_FAILED,
                                    QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    e.getMessage(),
                                    "SQLSTATE: " + sqlState));
                        }

                        result.setBody(objectMapper.valueToTree(rowsList));
                        return Mono.just(result);
                    })
                    .flatMap(obj -> obj)
                    .subscribeOn(Schedulers.boundedElastic());
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            log.debug(Thread.currentThread().getName() + ": datasourceCreate() called for Databricks plugin.");
            // Ensure the databricks JDBC driver is loaded.
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                throw new RuntimeException(e);
            }

            BearerTokenAuth bearerTokenAuth = (BearerTokenAuth) datasourceConfiguration.getAuthentication();

            Properties p = new Properties();
            p.put("UID", "token");
            p.put("PWD", bearerTokenAuth.getBearerToken() == null ? "" : bearerTokenAuth.getBearerToken());
            String url;
            if (JDBC_URL_CONFIGURATION.equals(datasourceConfiguration
                    .getProperties()
                    .get(CONFIGURATION_TYPE_INDEX)
                    .getValue())) {
                url = (String) datasourceConfiguration
                        .getProperties()
                        .get(JDBC_URL_INDEX)
                        .getValue();
            } else if (FORM_PROPERTIES_CONFIGURATION.equals(datasourceConfiguration
                    .getProperties()
                    .get(CONFIGURATION_TYPE_INDEX)
                    .getValue())) {
                // Set up the connection URL
                StringBuilder urlBuilder = new StringBuilder("jdbc:databricks://");

                List<String> hosts = datasourceConfiguration.getEndpoints().stream()
                        .map(endpoint ->
                                endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), DEFAULT_PORT))
                        .collect(Collectors.toList());

                urlBuilder.append(String.join(",", hosts)).append(";");

                url = urlBuilder.toString();

                p.put(
                        "httpPath",
                        datasourceConfiguration
                                .getProperties()
                                .get(HTTP_PATH_INDEX)
                                .getValue());
                p.put("AuthMech", "3");

                // Always enable SSL for Databricks connections.
                p.put("SSL", "1");

                // Add user agent tag. Default to Appsmith if not provided.
                String userAgentTag = (String) datasourceConfiguration
                        .getProperties()
                        .get(USER_AGENT_TAG)
                        .getValue();
                if (!StringUtils.hasText(userAgentTag)) {
                    userAgentTag = "Appsmith";
                }

                p.put("UserAgentEntry", userAgentTag);
            } else {
                url = "";
            }

            return (Mono<Connection>) Mono.fromCallable(() -> {
                        log.debug(Thread.currentThread().getName() + ": creating connection from Databricks plugin.");
                        Connection connection = DriverManager.getConnection(url, p);

                        // Execute statements to default catalog and schema for all queries on this datasource.
                        if (FORM_PROPERTIES_CONFIGURATION.equals(datasourceConfiguration
                                .getProperties()
                                .get(CONFIGURATION_TYPE_INDEX)
                                .getValue())) {
                            try (Statement statement = connection.createStatement(); ) {
                                String catalog = (String) datasourceConfiguration
                                        .getProperties()
                                        .get(CATALOG_INDEX)
                                        .getValue();
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
                                String schema = (String) datasourceConfiguration
                                        .getProperties()
                                        .get(SCHEMA_INDEX)
                                        .getValue();
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
                        }

                        return Mono.just(connection);
                    })
                    .flatMap(obj -> obj)
                    .subscribeOn(Schedulers.boundedElastic());
        }

        @Override
        public void datasourceDestroy(Connection connection) {
            log.debug(Thread.currentThread().getName() + ": datasourceDestroy() called for Databricks plugin.");
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                // This should not happen ideally.
                log.error("Error closing Databricks connection : " + e.getMessage());
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return new HashSet<>();
        }

        @Override
        public Mono<DatasourceStructure> getStructure(
                Connection connection, DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": getStructure() called for Databricks plugin.");
            return Mono.fromSupplier(() -> {
                        log.debug(Thread.currentThread().getName()
                                + ": fetching datasource structure from Databricks plugin.");
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
