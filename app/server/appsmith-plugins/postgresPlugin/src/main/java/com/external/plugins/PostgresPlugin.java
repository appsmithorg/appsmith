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
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    public static class PostgresPluginExecutor implements PluginExecutor<Connection> {

        private final Scheduler scheduler = Schedulers.elastic();

        private static final String TABLES_QUERY =
                "select a.attname                                                      as name,\n" +
                "       t1.typname                                                     as column_type,\n" +
                "       case when a.atthasdef then pg_get_expr(d.adbin, d.adrelid) end as default_expr,\n" +
                "       c.relkind                                                      as kind,\n" +
                "       c.relname                                                      as table_name,\n" +
                "       n.nspname                                                      as schema_name\n" +
                "from pg_catalog.pg_attribute a\n" +
                "         left join pg_catalog.pg_type t1 on t1.oid = a.atttypid\n" +
                "         inner join pg_catalog.pg_class c on a.attrelid = c.oid\n" +
                "         left join pg_catalog.pg_namespace n on c.relnamespace = n.oid\n" +
                "         left join pg_catalog.pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum\n" +
                "where a.attnum > 0\n" +
                "  and not a.attisdropped\n" +
                "  and n.nspname not in ('information_schema', 'pg_catalog')\n" +
                "  and c.relkind in ('r', 'v')\n" +
                "  and pg_catalog.pg_table_is_visible(a.attrelid)\n" +
                "order by c.relname, a.attnum;";

        public static final String KEYS_QUERY =
                "select c.conname                                         as constraint_name,\n" +
                "       c.contype                                         as constraint_type,\n" +
                "       sch.nspname                                       as self_schema,\n" +
                "       tbl.relname                                       as self_table,\n" +
                "       array_agg(col.attname order by u.attposition)     as self_columns,\n" +
                "       f_sch.nspname                                     as foreign_schema,\n" +
                "       f_tbl.relname                                     as foreign_table,\n" +
                "       array_agg(f_col.attname order by f_u.attposition) as foreign_columns,\n" +
                "       pg_get_constraintdef(c.oid)                       as definition\n" +
                "from pg_constraint c\n" +
                "         left join lateral unnest(c.conkey) with ordinality as u(attnum, attposition) on true\n" +
                "         left join lateral unnest(c.confkey) with ordinality as f_u(attnum, attposition)\n" +
                "                   on f_u.attposition = u.attposition\n" +
                "         join pg_class tbl on tbl.oid = c.conrelid\n" +
                "         join pg_namespace sch on sch.oid = tbl.relnamespace\n" +
                "         left join pg_attribute col on (col.attrelid = tbl.oid and col.attnum = u.attnum)\n" +
                "         left join pg_class f_tbl on f_tbl.oid = c.confrelid\n" +
                "         left join pg_namespace f_sch on f_sch.oid = f_tbl.relnamespace\n" +
                "         left join pg_attribute f_col on (f_col.attrelid = f_tbl.oid and f_col.attnum = f_u.attnum)\n" +
                "group by constraint_name, constraint_type, self_schema, self_table, definition, foreign_schema, foreign_table\n" +
                "order by self_schema, self_table;";

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            
            return (Mono<ActionExecutionResult>) Mono.fromCallable(() -> {

                try {
                    if (connection == null || connection.isClosed() || !connection.isValid(VALIDITY_CHECK_TIMEOUT)) {
                        System.out.println("Encountered stale connection in Postgres plugin. Reporting back.");
                        throw new StaleConnectionException();
                    }
                } catch (SQLException error) {
                    // This exception is thrown only when the timeout to `isValid` is negative. Since, that's not the case,
                    // here, this should never happen.
                    System.out.println("Error checking validity of Postgres connection." + error);
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
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
                } finally {
                    if (resultSet != null) {
                        try {
                            resultSet.close();
                        } catch (SQLException e) {
                            System.out.println("Error closing Postgres ResultSet" + e.getMessage());
                        }
                    }

                    if (statement != null) {
                        try {
                            statement.close();
                        } catch (SQLException e) {
                            System.out.println("Error closing Postgres Statement" + e.getMessage());
                        }
                    }

                }

                ActionExecutionResult result = new ActionExecutionResult();
                result.setBody(objectMapper.valueToTree(rowsList));
                result.setIsExecutionSuccess(true);
                System.out.println(Thread.currentThread().getName() + ": In the PostgresPlugin, got action execution result");
                return Mono.just(result);
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);

        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
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
            properties.put(SSL, isSslEnabled);
            if (authentication.getUsername() != null) {
                properties.put(USER, authentication.getUsername());
            }
            if (authentication.getPassword() != null) {
                properties.put(PASSWORD, authentication.getPassword());
            }

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

            return Mono.fromCallable(() -> {
                try {
                    System.out.println(Thread.currentThread().getName() + ": Connecting to Postgres db");
                    Connection connection = DriverManager.getConnection(url, properties);
                    connection.setReadOnly(
                            configurationConnection != null && READ_ONLY.equals(configurationConnection.getMode()));
                    return Mono.just(connection);

                } catch (SQLException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Error connecting to Postgres.", e));

                }
            })
                    .flatMap(obj -> obj)
                    .map(conn -> (Connection) conn)
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(Connection connection) {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                System.out.println("Error closing Postgres Connection." + e.getMessage());
            }
        }

        @Override
        public Set<String> validateDatasource(@NonNull DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add("Missing endpoint.");
            } else {
                for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    if (StringUtils.isEmpty(endpoint.getHost())) {
                        invalids.add("Missing hostname.");
                    } else if (endpoint.getHost().contains("/") || endpoint.getHost().contains(":")) {
                        invalids.add("Host value cannot contain `/` or `:` characters. Found `" + endpoint.getHost() + "`.");
                    }
                }
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
                                connection.close();
                            }
                        } catch (SQLException e) {
                            System.out.println(Thread.currentThread().getName() + ": Error closing Postgres connection that was made for testing." + e.getMessage());
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Connection connection, DatasourceConfiguration datasourceConfiguration) {

            try {
                if (connection == null || connection.isClosed() || !connection.isValid(VALIDITY_CHECK_TIMEOUT)) {
                    System.out.println(Thread.currentThread().getName() + ": Encountered stale connection in Postgres plugin. Reporting back.");
                    throw new StaleConnectionException();
                }
            } catch (SQLException e) {
                // This exception is thrown only when the timeout to `isValid` is negative. Since, that's not the case,
                // here, this should never happen.
                System.out.println(Thread.currentThread().getName() + ": Error checking validity of Postgres connection." + e.getMessage());
            }

            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();

            return Mono.fromSupplier(() -> {

                // Ref: <https://docs.oracle.com/en/java/javase/11/docs/api/java.sql/java/sql/DatabaseMetaData.html>.

                try (Statement statement = connection.createStatement()) {

                    // Get tables and fill up their columns.
                    try (ResultSet columnsResultSet = statement.executeQuery(TABLES_QUERY)) {
                        while (columnsResultSet.next()) {
                            final char kind = columnsResultSet.getString("kind").charAt(0);
                            final String schemaName = columnsResultSet.getString("schema_name");
                            final String tableName = columnsResultSet.getString("table_name");
                            final String fullTableName = schemaName + "." + tableName;
                            if (!tablesByName.containsKey(fullTableName)) {
                                tablesByName.put(fullTableName, new DatasourceStructure.Table(
                                        kind == 'r' ? DatasourceStructure.TableType.TABLE : DatasourceStructure.TableType.VIEW,
                                        fullTableName,
                                        new ArrayList<>(),
                                        new ArrayList<>(),
                                        new ArrayList<>()
                                ));
                            }
                            final DatasourceStructure.Table table = tablesByName.get(fullTableName);
                            table.getColumns().add(new DatasourceStructure.Column(
                                    columnsResultSet.getString("name"),
                                    columnsResultSet.getString("column_type"),
                                    columnsResultSet.getString("default_expr")
                            ));
                        }
                    }

                    // Get tables' constraints and fill those up.
                    try (ResultSet constraintsResultSet = statement.executeQuery(KEYS_QUERY)) {
                        while (constraintsResultSet.next()) {
                            final String constraintName = constraintsResultSet.getString("constraint_name");
                            final char constraintType = constraintsResultSet.getString("constraint_type").charAt(0);
                            final String selfSchema = constraintsResultSet.getString("self_schema");
                            final String tableName = constraintsResultSet.getString("self_table");
                            final String fullTableName = selfSchema + "." + tableName;
                            if (!tablesByName.containsKey(fullTableName)) {
                                continue;
                            }

                            final DatasourceStructure.Table table = tablesByName.get(fullTableName);

                            if (constraintType == 'p') {
                                final DatasourceStructure.PrimaryKey key = new DatasourceStructure.PrimaryKey(
                                        constraintName,
                                        List.of((String[]) constraintsResultSet.getArray("self_columns").getArray())
                                );
                                table.getKeys().add(key);

                            } else if (constraintType == 'f') {
                                final String foreignSchema = constraintsResultSet.getString("foreign_schema");
                                final String prefix = (foreignSchema.equalsIgnoreCase(selfSchema) ? "" : foreignSchema + ".")
                                        + constraintsResultSet.getString("foreign_table")
                                        + ".";

                                final DatasourceStructure.ForeignKey key = new DatasourceStructure.ForeignKey(
                                        constraintName,
                                        List.of((String[]) constraintsResultSet.getArray("self_columns").getArray()),
                                        Stream.of((String[]) constraintsResultSet.getArray("foreign_columns").getArray())
                                                .map(name -> prefix + name)
                                                .collect(Collectors.toList())
                                );

                                table.getKeys().add(key);

                            }
                        }
                    }

                    // Get/compute templates for each table and put those in.
                    for (DatasourceStructure.Table table : tablesByName.values()) {
                        final List<DatasourceStructure.Column> columnsWithoutDefault = table.getColumns()
                                .stream()
                                .filter(column -> column.getDefaultValue() == null)
                                .collect(Collectors.toList());

                        final List<String> columnNames = new ArrayList<>();
                        final List<String> columnValues = new ArrayList<>();
                        final StringBuilder setFragments = new StringBuilder();

                        for (DatasourceStructure.Column column : columnsWithoutDefault) {
                            final String name = column.getName();
                            final String type = column.getType();
                            String value;

                            if (type == null) {
                                value = "null";
                            } else if ("text".equals(type) || "varchar".equals(type)) {
                                value = "''";
                            } else if (type.startsWith("int")) {
                                value = "1";
                            } else if ("date".equals(type)) {
                                value = "'2019-07-01'";
                            } else if ("time".equals(type)) {
                                value = "'18:32:45'";
                            } else if ("timetz".equals(type)) {
                                value = "'04:05:06 PST'";
                            } else if ("timestamp".equals(type)) {
                                value = "TIMESTAMP '2019-07-01 10:00:00'";
                            } else if ("timestamptz".equals(type)) {
                                value = "TIMESTAMP WITH TIME ZONE '2019-07-01 06:30:00 CET'";
                            } else {
                                value = "''";
                            }

                            columnNames.add("\"" + name + "\"");
                            columnValues.add(value);
                            setFragments.append("\n    \"").append(name).append("\" = ").append(value);
                        }

                        final String quotedTableName = table.getName().replaceFirst("\\.(\\w+)", ".\"$1\"");
                        table.getTemplates().addAll(List.of(
                                new DatasourceStructure.Template("SELECT", "SELECT * FROM " + quotedTableName + " LIMIT 10;"),
                                new DatasourceStructure.Template("INSERT", "INSERT INTO " + quotedTableName
                                        + " (" + String.join(", ", columnNames) + ")\n"
                                        + "  VALUES (" + String.join(", ", columnValues) + ");"),
                                new DatasourceStructure.Template("UPDATE", "UPDATE " + quotedTableName + " SET"
                                        + setFragments.toString() + "\n"
                                        + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                                new DatasourceStructure.Template("DELETE", "DELETE FROM " + quotedTableName
                                        + "\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!")
                        ));
                    }

                } catch (SQLException throwable) {
                    return Mono.error(throwable);
                }

                structure.setTables(new ArrayList<>(tablesByName.values()));
                for (DatasourceStructure.Table table : structure.getTables()) {
                    table.getKeys().sort(Comparator.naturalOrder());
                }
                System.out.println(Thread.currentThread().getName() + ": Got the structure of postgres db");
                return structure;
            })
                    .map(resultStructure -> (DatasourceStructure) resultStructure)
                    .subscribeOn(scheduler);
        }
    }

}
