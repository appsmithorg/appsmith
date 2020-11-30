package com.external.plugins;

import com.appsmith.external.models.*;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import io.r2dbc.spi.ConnectionFactoryOptions;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.RowMetadata;
import io.r2dbc.spi.Row;
import io.r2dbc.spi.ColumnMetadata;
import io.r2dbc.spi.Result;
//import org.joda.time.Interval;

//TODO: remove them
//import java.sql.Connection;
/*
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
*/
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
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

        private final Scheduler scheduler = Schedulers.boundedElastic();

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

        /**
         * Sample output for KEYS_QUERY:
         *
         *   constraint_name  | constraint_type | self_schema | self_table | self_columns | foreign_schema | foreign_table | foreign_columns |    definition
         * -------------------+-----------------+-------------+------------+--------------+----------------+---------------+-----------------+-------------------
         *  test_email_key    | u               | public      | test       | {email}      |                |               | {NULL}          | UNIQUE (email)
         *  test_pkey         | p               | public      | test       | {id}         |                |               | {NULL}          | PRIMARY KEY (id)
         *  test_username_key | u               | public      | test       | {username}   |                |               | {NULL}          | UNIQUE (username)
         * (3 rows)
         */
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

        /**
         * 1. Parse the actual row objects returned by r2dbc driver for postgresql statements.
         * 2. Return the row as a map {column_name -> column_value}.
         */
        private Map<String, Object> getRow(Row row, RowMetadata meta) {
            /**
             * 1. Not adding any null check for params, because any exception thrown by this method is expected to be
             *    caught via "onErrorResume" or similar webflux method.
             */
            Iterator<ColumnMetadata> iterator = (Iterator<ColumnMetadata>) meta.getColumnMetadatas().iterator();
            Map<String, Object> processedRow = new LinkedHashMap<>();

            while(iterator.hasNext()) {
                ColumnMetadata metaData = iterator.next();
                String columnName = metaData.getName();
                //TODO: remove it.
                System.out.println("devtest: colname: " + columnName);
                System.out.println("devtest: metadata: " + metaData);
                System.out.println("devtest: type: " + metaData.getJavaType());
                Object columnValue = row.get(columnName);
                String typeName = metaData.getJavaType().toString();

                //TODO: remove it.
                //System.out.println("devtest: colname: " + columnName);
                System.out.println("devtest: coltype: " + typeName);

                if(java.time.LocalDate.class.toString().equalsIgnoreCase(typeName)
                        && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_LOCAL_DATE.format(row.get(columnName,
                            LocalDate.class));
                }
                else if ((java.time.LocalDateTime.class.toString().equalsIgnoreCase(typeName))
                        && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE_TIME.format(
                            LocalDateTime.of(
                                    row.get(columnName, LocalDateTime.class).toLocalDate(),
                                    row.get(columnName, LocalDateTime.class).toLocalTime()
                            )
                    ) + "Z";
                }
                else if(java.time.LocalTime.class.toString().equalsIgnoreCase(typeName)
                        && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_LOCAL_TIME.format(row.get(columnName,
                            LocalTime.class));
                }
                else if(java.time.OffsetTime.class.toString().equalsIgnoreCase(typeName)
                        && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_OFFSET_TIME.format(row.get(columnName,
                            OffsetTime.class));
                }
                else if(java.time.OffsetDateTime.class.toString().equalsIgnoreCase(typeName)
                        && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(
                            LocalDateTime.of(
                                    row.get(columnName, LocalDateTime.class).toLocalDate(),
                                    row.get(columnName, LocalDateTime.class).toLocalTime()
                            )
                    ) + "Z";
                }
                else if (java.time.Year.class.toString().equalsIgnoreCase(typeName)
                        && columnValue != null) {
                    columnValue = row.get(columnName, LocalDate.class).getYear();
                }
                else if (String.class.toString().equalsIgnoreCase(typeName)
                        && columnValue != null) {
                    columnValue = row.get(columnName, String.class);
                }
                else {
                    columnValue = row.get(columnName);
                }

                //TODO: remove it.
                System.out.println("devtest: colval: " + columnValue);
                processedRow.put(columnName, columnValue);
            }

            return processedRow;
        }

        /**
         * 1. Check the type of sql query - i.e Select ... or Insert/Update/Drop
         * 2. In case sql queries are chained together, then decide the type based on the last query. i.e In case of
         *    query "select * from test; updated test ..." the type of query will be based on the update statement.
         * 3. This is used because the output returned to client is based on the type of the query. In case of a
         *    select query rows are returned, whereas, in case of any other query the number of updated rows is
         *    returned.
         */
        private boolean getIsSelectQuery(String query) {
            String[] queries = query.split(";");
            return queries[queries.length - 1].trim().split(" ")[0].equalsIgnoreCase("select");
        }

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            String query = actionConfiguration.getBody().trim();

            if (query == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required parameter: Query."));
            }

            boolean isSelectQuery = getIsSelectQuery(query);
            final List<Map<String, Object>> rowsList = new ArrayList<>(50);
            Flux<Result> resultFlux = Flux.from(connection.createStatement(query).execute());

            if(isSelectQuery) {
                return resultFlux
                        .flatMap(result -> {
                            return result.map((row, meta) -> {
                                rowsList.add(getRow(row, meta));
                                return result;
                            });
                        })
                        .collectList()
                        .flatMap(execResult -> {
                            ActionExecutionResult result = new ActionExecutionResult();
                            result.setBody(objectMapper.valueToTree(rowsList));
                            result.setIsExecutionSuccess(true);
                            log.debug("In the PostgresqlPlugin, got action execution result: " + result.toString());
                            return Mono.just(result);
                        })
                        .onErrorResume(exception -> {
                            log.debug("In the action execution error mode.", exception);//TODO: remove it.
                            exception.printStackTrace();
                            ActionExecutionResult result = new ActionExecutionResult();
                            result.setBody(exception.getMessage());
                            result.setIsExecutionSuccess(false);
                            return Mono.just(result);
                        })
                        .subscribeOn(Schedulers.elastic());
            }
            else {
                return resultFlux
                        .flatMap(result -> result.getRowsUpdated())
                        .collectList()
                        .flatMap(list -> Mono.just(list.get(list.size() - 1)))
                        .flatMap(rowsUpdated -> {
                            rowsList.add(
                                    Map.of(
                                            "affectedRows",
                                            ObjectUtils.defaultIfNull(rowsUpdated, 0)
                                    )
                            );
                            ActionExecutionResult result = new ActionExecutionResult();
                            result.setBody(objectMapper.valueToTree(rowsList));
                            result.setIsExecutionSuccess(true);
                            log.debug("In the PostgresqlPlugin, got action execution result: " + result.toString());
                            return Mono.just(result);
                        })
                        .onErrorResume(exception -> {
                            log.debug("In the action execution error mode.", exception);
                            exception.printStackTrace();
                            ActionExecutionResult result = new ActionExecutionResult();
                            result.setBody(exception.getMessage());
                            result.setIsExecutionSuccess(false);
                            return Mono.just(result);
                        })
                        .subscribeOn(Schedulers.elastic());
            }
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();

            StringBuilder urlBuilder = new StringBuilder();
            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                urlBuilder.append(datasourceConfiguration.getUrl());
            } else {
                urlBuilder.append("r2dbc:postgresql://");
                final List<String> hosts = new ArrayList<>();

                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    hosts.add(endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 5432L));
                }

                urlBuilder.append(String.join(",", hosts)).append("/");

                if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                    urlBuilder.append(authentication.getDatabaseName());
                }
            }

            ConnectionFactoryOptions baseOptions = ConnectionFactoryOptions.parse(urlBuilder.toString());
            ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);
            ob = ob.option(ConnectionFactoryOptions.USER, authentication.getUsername());
            ob = ob.option(ConnectionFactoryOptions.PASSWORD, authentication.getPassword());

            //TODO: fix it.
            /*com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();
            final boolean isSslEnabled = configurationConnection != null
                    && configurationConnection.getSsl() != null
                    && !SSLDetails.AuthType.NO_SSL.equals(configurationConnection.getSsl().getAuthType());
            ob = ob.option(ConnectionFactoryOptions.SSL, isSslEnabled);
*/
            //TODO: fix return exception.
            return (Mono<Connection>) Mono.from(ConnectionFactories.get(ob.build()).create())
                    .onErrorResume(exception -> {
                        log.debug("Error when creating datasource.", exception);
                        return Mono.error(Exceptions.propagate(exception));
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(Connection connection) {
            if (connection != null) {
                Mono.from(connection.close())
                        .onErrorResume(exception -> {
                            log.error("In datasourceDestroy function error mode.", exception);
                            return Mono.empty();
                        })
                        .subscribeOn(scheduler)
                        .subscribe();
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
            //TODO: check return on error stmt.
            return datasourceCreate(datasourceConfiguration)
                    .flatMap(connection -> {
                        return Mono.from(connection.close());
                    })
                    .then(Mono.just(new DatasourceTestResult()))
                    .onErrorResume(error -> {
                        log.error("Error when testing PostgreSQL datasource.", error);
                        return Mono.error(Exceptions.propagate(error));
                    })
                    .subscribeOn(scheduler);
        }

        /**
         * 1. Parse results obtained by running COLUMNS_QUERY defined on top of the page.
         * 2. A sample postgresql output for the query is also given near COLUMNS_QUERY definition on top of the page.
         */
        private void getTableInfo(Row row, RowMetadata meta, Map<String, DatasourceStructure.Table> tablesByName) {
            final char kind = row.get("kind", String.class).charAt(0);
            final String schemaName = row.get("schema_name", String.class);
            final String tableName = row.get("table_name", String.class);
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
                    row.get("name", String.class),
                    row.get("column_type", String.class),
                    row.get("default_expr", String.class)
            ));

            return;
        }

        /**
         * 1. Parse results obtained by running KEYS_QUERY defined on top of the page.
         * 2. A sample postgresql output for the query is also given near KEYS_QUERY definition on top of the page.
         */
        private void getKeyInfo(Row row, RowMetadata meta, Map<String, DatasourceStructure.Table> tablesByName,
                                Map<String, DatasourceStructure.Key> keyRegistry) {
            final String constraintName = row.get("constraint_name", String.class);
            final char constraintType = row.get("constraint_type", String.class).charAt(0);
            final String selfSchema = row.get("self_schema", String.class);
            final String tableName = row.get("self_table", String.class);
            final String fullTableName = selfSchema + "." + tableName;

            Iterator<ColumnMetadata> iterator = (Iterator<ColumnMetadata>) meta.getColumnMetadatas().iterator();

            while(iterator.hasNext()) {
                ColumnMetadata metaData = iterator.next();
                String columnName = metaData.getName();
                //TODO: remove it.
                System.out.println("devtest: colname: " + columnName);
                System.out.println("devtest: metadata: " + metaData);
                System.out.println("devtest: type: " + metaData.getJavaType());
                System.out.println("devtest: row.get(): " + row.get(columnName));
            }

            if (!tablesByName.containsKey(fullTableName)) {
                return;
            }

            final DatasourceStructure.Table table = tablesByName.get(fullTableName);

            if (constraintType == 'p') {
                final DatasourceStructure.PrimaryKey key = new DatasourceStructure.PrimaryKey(
                        constraintName,
                        List.of((String[]) row.get("self_columns"))
                );
                table.getKeys().add(key);

            } else if (constraintType == 'f') {
                final String foreignSchema = row.get("foreign_schema", String.class);
                final String prefix = (foreignSchema.equalsIgnoreCase(selfSchema) ? "" : foreignSchema + ".")
                        + row.get("foreign_table", String.class)
                        + ".";

                final DatasourceStructure.ForeignKey key = new DatasourceStructure.ForeignKey(
                        constraintName,
                        List.of((String[]) row.get("self_columns")),
                        Stream.of((String[]) row.get("foreign_columns"))
                                .map(name -> prefix + name)
                                .collect(Collectors.toList())
                );

                table.getKeys().add(key);

            }

            return;
        }

        /**
         * 1. Generate template for all tables in the database.
         */
        private void getTemplates(Map<String, DatasourceStructure.Table> tablesByName) {
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

            return;
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Connection connection, DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            return Flux.from(connection.createStatement(TABLES_QUERY).execute())
                    .flatMap(result -> {
                        return result.map((row, meta) -> {
                            getTableInfo(row, meta, tablesByName);

                            return result;
                        });
                    })
                    .collectList()
                    .thenMany(Flux.from(connection.createStatement(KEYS_QUERY).execute()))
                    .flatMap(result -> {
                        return result.map((row, meta) -> {
                            getKeyInfo(row, meta, tablesByName, keyRegistry);

                            return result;
                        });
                    })
                    .collectList()
                    .map(list -> {
                        /* Get templates for each table and put those in. */
                        getTemplates(tablesByName);
                        structure.setTables(new ArrayList<>(tablesByName.values()));
                        for (DatasourceStructure.Table table : structure.getTables()) {
                            table.getKeys().sort(Comparator.naturalOrder());
                        }

                        return structure;
                    })
                    .onErrorResume(error -> {
                        log.debug("In getStructure function error mode.", error);

                        return Mono.error(Exceptions.propagate(error));
                    })
                    .subscribeOn(scheduler);
        }
    }
}
