package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.NonNull;
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
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
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
    private static final int VALIDITY_CHECK_TIMEOUT = 5;

    private static final String DATE_COLUMN_TYPE_NAME = "date";

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
        public Mono<ActionExecutionResult> execute(Object connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            Connection conn = (Connection) connection;

            try {
                if (conn == null || conn.isClosed() || !conn.isValid(VALIDITY_CHECK_TIMEOUT)) {
                    log.info("Encountered stale connection in Postgres plugin. Reporting back.");
                    throw new StaleConnectionException();
                }
            } catch (SQLException error) {
                // This exception is thrown only when the timeout to `isValid` is negative. Since, that's not the case,
                // here, this should never happen.
                log.error("Error checking validity of Postgres connection.", error);
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
                    rowsList.add(Map.of("affectedRows", statement.getUpdateCount()));

                }

            } catch (SQLException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));

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

        @Override
        public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Error loading Postgres JDBC Driver class."));
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
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Error connecting to Postgres.", e));

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

        @Override
        public Mono<DatasourceStructure> getStructure(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .cast(Connection.class)
                    .flatMap(connection -> {
                        final DatasourceStructure structure = new DatasourceStructure();
                        final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
                        final Map<String, String> columnsRegister = new HashMap<>();

                        // Ref: <https://docs.oracle.com/en/java/javase/11/docs/api/java.sql/java/sql/DatabaseMetaData.html>.

                        try (connection) {
                            final Statement statement = connection.createStatement();

                            /*
                            final ResultSet tablesResultSet = statement.executeQuery(
                                    "select * from pg_catalog.pg_tables where schemaname not in ('information_schema', 'pg_catalog')"
                            );
                            while (tablesResultSet.next()) {
                                final String tableName = tablesResultSet.getString("tablename");
                                tablesByName.put(tableName, new DatasourceStructure.Table(
                                        DatasourceStructure.TableType.TABLE,
                                        tablesResultSet.getString("schemaname") + "." + tableName,
                                        new ArrayList<>()
                                ));
                            }

                            final ResultSet viewsResultSet = statement.executeQuery(
                                    "select * from pg_catalog.pg_views where schemaname not in ('information_schema', 'pg_catalog')"
                            );
                            while (viewsResultSet.next()) {
                                final String viewName = viewsResultSet.getString("viewname");
                                tablesByName.put(viewName, new DatasourceStructure.Table(
                                        DatasourceStructure.TableType.VIEW,
                                        viewsResultSet.getString("schemaname") + "." + viewName,
                                        new ArrayList<>()
                                ));
                            }
                            // */

                            final ResultSet columnsResultSet = statement.executeQuery(
                                    "select a.attname                                                      as name,\n" +
                                            "       a.attnum                                                       as column_num,\n" +
                                            "       t1.typname                                                     as a_type,\n" +
                                            "       case when a.atthasdef then pg_get_expr(d.adbin, d.adrelid) end as default_expr,\n" +
                                            "       c.relkind                                                      as kind,\n" +
                                            "       c.relname                                                      as table_name,\n" +
                                            "       n.nspname                                                      as schema_name\n" +
                                            "from pg_catalog.pg_attribute a\n" +
                                            "         left join pg_catalog.pg_type t1 on t1.oid = a.atttypid\n" +
                                            "         inner join pg_catalog.pg_class c on a.attrelid = c.oid\n" +
                                            "         left join pg_catalog.pg_namespace n on c.relnamespace = n.oid\n" +
                                            "         left join pg_catalog.pg_attrdef d on d.adrelid = c.oid\n" +
                                            "where a.attnum > 0\n" +
                                            "  and not a.attisdropped\n" +
                                            "  and n.nspname not in ('information_schema', 'pg_catalog')\n" +
                                            "  and c.relkind in ('r', 'v')\n" +
                                            "  and pg_catalog.pg_table_is_visible(a.attrelid)\n" +
                                            "order by c.relname, a.attnum;"
                            );

                            while (columnsResultSet.next()) {
                                final char kind = columnsResultSet.getString("kind").charAt(0);
                                final String tableName = columnsResultSet.getString("table_name");
                                final String schemaName = columnsResultSet.getString("schema_name");
                                final String fullTableName = ("public".equals(schemaName) ? "" : (schemaName + ".")) + tableName;
                                if (!tablesByName.containsKey(fullTableName)) {
                                    tablesByName.put(fullTableName, new DatasourceStructure.Table(
                                            kind == 'r' ? DatasourceStructure.TableType.TABLE : DatasourceStructure.TableType.VIEW,
                                            fullTableName,
                                            new ArrayList<>(),
                                            new ArrayList<>()
                                    ));
                                }
                                final DatasourceStructure.Table table = tablesByName.get(fullTableName);
                                final String columnNum = columnsResultSet.getString("column_num");
                                final String columnName = columnsResultSet.getString("name");
                                final String columnType = columnsResultSet.getString("a_type");
                                table.getColumns().add(new DatasourceStructure.Column(
                                        columnName, columnType, columnsResultSet.getString("default_expr")
                                ));
                                columnsRegister.put(
                                        schemaName + "." + tableName + "." + columnNum,
                                        columnName
                                );
                            }

                            /*
                            final ResultSet columnsResultSet1 = statement.executeQuery(
                                    "select a.attname                                                      as name,\n" +
                                            "       t1.typname                                                     as a_type,\n" +
                                            "       c.relname                                                      as key_name,\n" +
                                            "       i.indisunique as is_unique_index,\n" +
                                            "       i.indkey as column_numbers,\n" +
                                            "       n.nspname                                                      as schema_name\n" +
                                            "from pg_catalog.pg_attribute a\n" +
                                            "         left join pg_catalog.pg_type t1 on t1.oid = a.atttypid\n" +
                                            "         inner join pg_catalog.pg_class c on a.attrelid = c.oid\n" +
                                            "         left join pg_catalog.pg_namespace n on c.relnamespace = n.oid\n" +
                                            "         left join pg_catalog.pg_attrdef d on d.adrelid = c.oid\n" +
                                            "         left join pg_catalog.pg_index i on i.indexrelid = c.oid\n" +
                                            "where a.attnum > 0\n" +
                                            "  and not a.attisdropped\n" +
                                            "  and n.nspname not in ('information_schema', 'pg_catalog')\n" +
                                            "  and c.relkind in ('i')\n" +
                                            "  and pg_catalog.pg_table_is_visible(a.attrelid);"
                            );

                            while (columnsResultSet1.next()) {
                                final String keyName = columnsResultSet1.getString("key_name");
                                final String schemaName = columnsResultSet1.getString("schema_name");
                                for (final int cnum : (int[]) columnsResultSet.getArray("column_numbers").getArray()) {
                                    final String key = schemaName + "." + keyName + "." + cnum;
                                    final String columnName = columnsRegister.get(key);
                                }
                            }
                            // */

                            /*
                            final DatabaseMetaData metaData = connection.getMetaData();

                            final ResultSet resultSet = metaData.getTables(null, null, "%", new String[]{"TABLE", "VIEW", "ALIAS"});
                            while (resultSet.next()) {
                                final String tableName = resultSet.getString("TABLE_NAME");
                                tablesByName.put(tableName, new DatasourceStructure.Table(
                                        DatasourceStructure.TableType.valueOf(resultSet.getString("TABLE_TYPE")),
                                        tableName,
                                        new ArrayList<>()
                                ));
                            }

                            final ResultSet resultSet1 = metaData.getColumns(null, null, "%", "%");
                            while (resultSet1.next()) {
                                final String tableName = resultSet1.getString("TABLE_NAME");

                                final DatasourceStructure.Table table = tablesByName.get(resultSet1.getString("TABLE_SCHEM") + "." + tableName);
                                if (table == null) {
                                    continue;
                                }

                                table.getColumns().add(new DatasourceStructure.Column(
                                        resultSet1.getString("COLUMN_NAME"),
                                        resultSet1.getString("TYPE_NAME"),
                                        resultSet1.getString("COLUMN_DEF")
                                ));
                            }

                            final ResultSet indexesResultSet = statement.executeQuery("select * from pg_indexes");
                            while (indexesResultSet.next()) {
                                final String indexName = indexesResultSet.getString("indexname");
                                System.out.println("Index " + indexesResultSet.getString("tablename") + " " + indexesResultSet.getString("indexname") + ": " + indexesResultSet.getString("indexdef"));
                            }
                            // */

                        } catch (SQLException throwable) {
                            return Mono.error(Exceptions.propagate(throwable));

                        }

                        structure.setTables(new ArrayList<>(tablesByName.values()));
                        return Mono.just(structure);
                    });
        }
    }

}
