package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
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
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.models.Connection.Mode.READ_ONLY;

public class MySqlPlugin extends BasePlugin {

    static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";

    private static final String USER = "user";
    private static final String PASSWORD = "password";
    private static final int VALIDITY_CHECK_TIMEOUT = 5;

    private static final String DATE_COLUMN_TYPE_NAME = "date";
    private static final String DATETIME_COLUMN_TYPE_NAME = "datetime";
    private static final String TIMESTAMP_COLUMN_TYPE_NAME = "timestamp";

    private static final String COLUMNS_QUERY = "select tab.table_name as table_name,\n" +
            "       col.ordinal_position as column_id,\n" +
            "       col.column_name as column_name,\n" +
            "       col.data_type as column_type,\n" +
            "       col.is_nullable = 'YES' as is_nullable,\n" +
            "       col.column_key,\n" +
            "       col.extra\n" +
            "from information_schema.tables as tab\n" +
            "         inner join information_schema.columns as col\n" +
            "                    on col.table_schema = tab.table_schema\n" +
            "                        and col.table_name = tab.table_name\n" +
            "where tab.table_type = 'BASE TABLE'\n" +
            "  and tab.table_schema = database()\n" +
            "order by tab.table_name,\n" +
            "         col.ordinal_position;";

    private static final String KEYS_QUERY = "select i.constraint_name,\n" +
            "       i.TABLE_SCHEMA as self_schema,\n" +
            "       i.table_name as self_table,\n" +
            "       if(i.constraint_type = 'FOREIGN KEY', 'f', 'p') as constraint_type,\n" +
            "       k.column_name as self_column, -- k.ordinal_position, k.position_in_unique_constraint,\n" +
            "       k.referenced_table_schema as foreign_schema,\n" +
            "       k.referenced_table_name as foreign_table,\n" +
            "       k.referenced_column_name as foreign_column\n" +
            "from information_schema.table_constraints i\n" +
            "         left join information_schema.key_column_usage k\n" +
            "             on i.constraint_name = k.constraint_name and i.table_name = k.table_name\n" +
            "where i.table_schema = database()\n" +
            "  and k.constraint_schema = database()\n" +
            // "  and i.enforced = 'YES'\n" +  // Looks like this is not available on all versions of MySQL.
            "  and i.constraint_type in ('FOREIGN KEY', 'PRIMARY KEY')\n" +
            "order by i.table_name, i.constraint_name, k.position_in_unique_constraint;";

    public MySqlPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class MySqlPluginExecutor implements PluginExecutor<Connection> {

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            try {
                if (connection == null || connection.isClosed() || !connection.isValid(VALIDITY_CHECK_TIMEOUT)) {
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
                statement = connection.createStatement();
                boolean isResultSet = statement.execute(query);

                if (isResultSet) {
                    resultSet = statement.getResultSet();
                    ResultSetMetaData metaData = resultSet.getMetaData();
                    int colCount = metaData.getColumnCount();
                    while (resultSet.next()) {
                        // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                        Map<String, Object> row = new LinkedHashMap<>(colCount);
                        rowsList.add(row);

                        for (int i = 1; i <= colCount; i++) {
                            Object value;
                            final String typeName = metaData.getColumnTypeName(i);

                            if (resultSet.getObject(i) == null) {
                                value = null;

                            } else if (DATE_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                value = DateTimeFormatter.ISO_DATE.format(resultSet.getDate(i).toLocalDate());

                            } else if (DATETIME_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)
                                    || TIMESTAMP_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                value = DateTimeFormatter.ISO_DATE_TIME.format(
                                        LocalDateTime.of(
                                                resultSet.getDate(i).toLocalDate(),
                                                resultSet.getTime(i).toLocalTime()
                                        )
                                ) + "Z";

                            } else if ("year".equalsIgnoreCase(typeName)) {
                                value = resultSet.getDate(i).toLocalDate().getYear();

                            } else {
                                value = resultSet.getObject(i);

                            }

                            row.put(metaData.getColumnLabel(i), value);
                        }
                    }

                } else {
                    rowsList.add(Map.of(
                            "affectedRows",
                            ObjectUtils.defaultIfNull(statement.getUpdateCount(), 0))
                    );

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
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Error loading MySQL JDBC Driver class."));
            }

            String url;
            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();

            com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();

            Properties properties = new Properties();
            // TODO: Set SSL connection parameters as well.
            if (authentication.getUsername() != null) {
                properties.put(USER, authentication.getUsername());
            }
            if (authentication.getPassword() != null) {
                properties.put(PASSWORD, authentication.getPassword());
            }

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
        public void datasourceDestroy(Connection connection) {
            try {
                if (connection != null) {
                    connection.close();
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
                                connection.close();
                            }
                        } catch (SQLException e) {
                            log.warn("Error closing MySQL connection that was made for testing.", e);
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Connection connection, DatasourceConfiguration datasourceConfiguration) {
            try {
                if (connection == null || connection.isClosed() || !connection.isValid(VALIDITY_CHECK_TIMEOUT)) {
                    log.info("Encountered stale connection in Postgres plugin. Reporting back.");
                    throw new StaleConnectionException();
                }
            } catch (SQLException error) {
                // This exception is thrown only when the timeout to `isValid` is negative. Since, that's not the case,
                // here, this should never happen.
                log.error("Error checking validity of Postgres connection.", error);
            }

            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();

            // Ref: <https://docs.oracle.com/en/java/javase/11/docs/api/java.sql/java/sql/DatabaseMetaData.html>.

            try (Statement statement = connection.createStatement()) {

                // Get tables and fill up their columns.
                try (ResultSet columnsResultSet = statement.executeQuery(COLUMNS_QUERY)) {
                    while (columnsResultSet.next()) {
                        final String tableName = columnsResultSet.getString("table_name");
                        if (!tablesByName.containsKey(tableName)) {
                            tablesByName.put(tableName, new DatasourceStructure.Table(
                                    DatasourceStructure.TableType.TABLE,
                                    tableName,
                                    new ArrayList<>(),
                                    new ArrayList<>(),
                                    new ArrayList<>()
                            ));
                        }
                        final DatasourceStructure.Table table = tablesByName.get(tableName);
                        table.getColumns().add(new DatasourceStructure.Column(
                                columnsResultSet.getString("column_name"),
                                columnsResultSet.getString("column_type"),
                                null
                        ));
                    }
                }

                // Get tables' constraints and fill those up.
                try (ResultSet constraintsResultSet = statement.executeQuery(KEYS_QUERY)) {
                    final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

                    while (constraintsResultSet.next()) {
                        final String constraintName = constraintsResultSet.getString("constraint_name");
                        final char constraintType = constraintsResultSet.getString("constraint_type").charAt(0);
                        final String selfSchema = constraintsResultSet.getString("self_schema");
                        final String tableName = constraintsResultSet.getString("self_table");
                        if (!tablesByName.containsKey(tableName)) {
                            continue;
                        }

                        final DatasourceStructure.Table table = tablesByName.get(tableName);
                        final String keyFullName = tableName + "." + constraintsResultSet.getString("constraint_name");

                        if (constraintType == 'p') {
                            if (!keyRegistry.containsKey(keyFullName)) {
                                final DatasourceStructure.PrimaryKey key = new DatasourceStructure.PrimaryKey(
                                        constraintName,
                                        new ArrayList<>()
                                );
                                keyRegistry.put(keyFullName, key);
                                table.getKeys().add(key);
                            }
                            ((DatasourceStructure.PrimaryKey) keyRegistry.get(keyFullName)).getColumnNames().add(constraintsResultSet.getString("self_column"));

                        } else if (constraintType == 'f') {
                            final String foreignSchema = constraintsResultSet.getString("foreign_schema");
                            final String prefix = (foreignSchema.equalsIgnoreCase(selfSchema) ? "" : foreignSchema + ".")
                                    + constraintsResultSet.getString("foreign_table")
                                    + ".";

                            if (!keyRegistry.containsKey(keyFullName)) {
                                final DatasourceStructure.ForeignKey key = new DatasourceStructure.ForeignKey(
                                        constraintName,
                                        new ArrayList<>(),
                                        new ArrayList<>()
                                );
                                keyRegistry.put(keyFullName, key);
                                table.getKeys().add(key);
                            }
                            ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName)).getFromColumns()
                                    .add(constraintsResultSet.getString("self_column"));
                            ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName)).getToColumns()
                                    .add(prefix + constraintsResultSet.getString("foreign_column"));

                        }
                    }
                }

                // Get/compute templates for each table and put those in.
                for (DatasourceStructure.Table table : tablesByName.values()) {
                    final List<DatasourceStructure.Column> columnsWithoutDefault = table.getColumns()
                            .stream()
                            .filter(column -> column.getDefaultValue() == null)
                            .collect(Collectors.toList());

                    final String columnNames = columnsWithoutDefault
                            .stream()
                            .map(DatasourceStructure.Column::getName)
                            .collect(Collectors.joining(", "));

                    final String columnValues = columnsWithoutDefault
                            .stream()
                            .map(DatasourceStructure.Column::getType)
                            .map(type -> {
                                if (type == null) {
                                    return "null";
                                } else if ("text".equals(type) || "varchar".equals(type)) {
                                    return "''";
                                } else if (type.startsWith("int")) {
                                    return "1";
                                } else if (type.startsWith("double")) {
                                    return "1.0";
                                } else if (DATE_COLUMN_TYPE_NAME.equals(type)) {
                                    return "'2019-07-01'";
                                } else if (DATETIME_COLUMN_TYPE_NAME.equals(type)
                                        || TIMESTAMP_COLUMN_TYPE_NAME.equals(type)) {
                                    return "'2019-07-01 10:00:00'";
                                } else {
                                    return "''";
                                }
                            })
                            .collect(Collectors.joining(", "));

                    table.getTemplates().addAll(List.of(
                            new DatasourceStructure.Template("SELECT", "SELECT * FROM " + table.getName() + " LIMIT 10;"),
                            new DatasourceStructure.Template("INSERT", "INSERT INTO " + table.getName()
                                    + " (" + columnNames + ")\n"
                                    + "  VALUES (" + columnValues + ");"),
                            new DatasourceStructure.Template("DELETE", "DELETE FROM " + table.getName()
                                    + "\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!")
                    ));
                }

            } catch (SQLException throwable) {
                return Mono.error(Exceptions.propagate(throwable));

            }

            structure.setTables(new ArrayList<>(tablesByName.values()));
            for (DatasourceStructure.Table table : structure.getTables()) {
                table.getKeys().sort(Comparator.naturalOrder());
            }
            return Mono.just(structure);
        }
    }
}
