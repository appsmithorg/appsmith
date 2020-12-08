package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;

import io.r2dbc.spi.ConnectionFactoryOptions;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.RowMetadata;
import io.r2dbc.spi.Row;
import io.r2dbc.spi.ColumnMetadata;
import io.r2dbc.spi.Result;
import io.r2dbc.spi.ValidationDepth;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.reactivestreams.Publisher;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;

public class MySqlPlugin extends BasePlugin {

    private static final String DATE_COLUMN_TYPE_NAME = "date";
    private static final String DATETIME_COLUMN_TYPE_NAME = "datetime";
    private static final String TIMESTAMP_COLUMN_TYPE_NAME = "timestamp";

    /**
     Example output for COLUMNS_QUERY:
     +------------+-----------+-------------+-------------+-------------+------------+----------------+
     | table_name | column_id | column_name | column_type | is_nullable | COLUMN_KEY | EXTRA          |
     +------------+-----------+-------------+-------------+-------------+------------+----------------+
     | test       |         1 | id          | int         |           0 | PRI        | auto_increment |
     | test       |         2 | firstname   | varchar     |           1 |            |                |
     | test       |         3 | middlename  | varchar     |           1 |            |                |
     | test       |         4 | lastname    | varchar     |           1 |            |                |
     +------------+-----------+-------------+-------------+-------------+------------+----------------+
     */
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

    /**
     Example output for KEYS_QUERY:
     +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     | CONSTRAINT_NAME | self_schema | self_table | constraint_type | self_column | foreign_schema | foreign_table | foreign_column |
     +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     | PRIMARY         | mytestdb    | test       | p               | id          | NULL           | NULL          | NULL           |
     +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     */
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
        private final Scheduler scheduler = Schedulers.boundedElastic();

        /**
         * 1. Parse the actual row objects returned by r2dbc driver for mysql statements.
         * 2. Return the row as a map {column_name -> column_value}.
         */
        private Map<String, Object> getRow(Row row, RowMetadata meta) {
            Iterator<ColumnMetadata> iterator = (Iterator<ColumnMetadata>) meta.getColumnMetadatas().iterator();
            Map<String, Object> processedRow = new LinkedHashMap<>();

            while(iterator.hasNext()) {
                ColumnMetadata metaData = iterator.next();
                String columnName = metaData.getName();
                String typeName = metaData.getJavaType().toString();
                Object columnValue = row.get(columnName);

                if(java.time.LocalDate.class.toString().equalsIgnoreCase(typeName)
                        && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE.format(row.get(columnName,
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
                    columnValue = DateTimeFormatter.ISO_TIME.format(row.get(columnName,
                            LocalTime.class));
                }
                else if (java.time.Year.class.toString().equalsIgnoreCase(typeName)
                        && columnValue != null) {
                    columnValue = row.get(columnName, LocalDate.class).getYear();
                }
                else {
                    columnValue = row.get(columnName);
                }

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
        private boolean getIsSelectOrShowQuery(String query) {
            String[] queries = query.split(";");
            return (queries[queries.length - 1].trim().split(" ")[0].equalsIgnoreCase("select")
                    || queries[queries.length - 1].trim().split(" ")[0].equalsIgnoreCase("show"));
        }

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            String query = actionConfiguration.getBody().trim();

            if (query == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required parameter: Query."));
            }

            boolean isSelectOrShowQuery = getIsSelectOrShowQuery(query);
            final List<Map<String, Object>> rowsList = new ArrayList<>(50);
            Flux<Result> resultFlux = Mono.from(connection.validate(ValidationDepth.REMOTE))
                                        .flatMapMany(isValid -> {
                                            if(isValid) {
                                                return connection.createStatement(query).execute();
                                            }
                                            else {
                                                return Flux.error(new StaleConnectionException());
                                            }
                                        });
            Mono<List<Map<String, Object>>> resultMono = null;

            if(isSelectOrShowQuery) {
                resultMono = resultFlux
                        .flatMap(result -> {
                            return result.map((row, meta) -> {
                                rowsList.add(getRow(row, meta));
                                return result;
                            });
                        })
                        .collectList()
                        .flatMap(execResult -> {
                            return Mono.just(rowsList);
                        });
            }
            else {
                resultMono = resultFlux
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
                            return Mono.just(rowsList);
                        });
            }

            return resultMono
                    .flatMap(res -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setBody(objectMapper.valueToTree(rowsList));
                        result.setIsExecutionSuccess(true);
                        System.out.println(Thread.currentThread().getName() + " In the MySqlPlugin, got action " +
                                "execution result: " + result.toString());
                        return Mono.just(result);
                    })
                    .subscribeOn(scheduler);

        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();

            StringBuilder urlBuilder = new StringBuilder();
            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                urlBuilder.append(datasourceConfiguration.getUrl());
            } else {
                urlBuilder.append("r2dbc:mysql://");
                final List<String> hosts = new ArrayList<>();

                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    hosts.add(endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 3306L));
                }

                urlBuilder.append(String.join(",", hosts)).append("/");

                if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                    urlBuilder.append(authentication.getDatabaseName());
                }

            }

            urlBuilder.append("?zeroDateTimeBehavior=convertToNull");
            final List<Property> dsProperties = datasourceConfiguration.getProperties();

            if (dsProperties != null) {
                for (Property property : dsProperties) {
                    if ("serverTimezone".equals(property.getKey()) && !StringUtils.isEmpty(property.getValue())) {
                        urlBuilder.append("&serverTimezone=").append(property.getValue());
                        break;
                    }
                }
            }

            ConnectionFactoryOptions baseOptions = ConnectionFactoryOptions.parse(urlBuilder.toString());
            ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);
            ob = ob.option(ConnectionFactoryOptions.USER, authentication.getUsername());
            ob = ob.option(ConnectionFactoryOptions.PASSWORD, authentication.getPassword());

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
                            log.debug("In datasourceDestroy function error mode.", exception);
                            return Mono.empty();
                        })
                        .subscribeOn(scheduler)
                        .subscribe();
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
            } else if (!CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    if (endpoint.getHost().contains("/") || endpoint.getHost().contains(":")) {
                        invalids.add("Host value cannot contain `/` or `:` characters. Found `" + endpoint.getHost() + "`.");
                    }
                }
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
                    .flatMap(connection -> {
                        return Mono.from(connection.close());
                    })
                    .then(Mono.just(new DatasourceTestResult()))
                    .onErrorResume(error -> {
                        log.error("Error when testing MySQL datasource.", error);
                        return Mono.just(new DatasourceTestResult(error.getMessage()));
                    })
                    .subscribeOn(scheduler);

        }

        /**
         * 1. Parse results obtained by running COLUMNS_QUERY defined on top of the page.
         * 2. A sample mysql output for the query is also given near COLUMNS_QUERY definition on top of the page.
         */
        private void getTableInfo(Row row, RowMetadata meta, Map<String, DatasourceStructure.Table> tablesByName) {
            final String tableName = row.get("table_name", String.class);

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
                    row.get("column_name", String.class),
                    row.get("column_type", String.class),
                    null
            ));

            return;
        }

        /**
         * 1. Parse results obtained by running KEYS_QUERY defined on top of the page.
         * 2. A sample mysql output for the query is also given near KEYS_QUERY definition on top of the page.
         */
        private void getKeyInfo(Row row, RowMetadata meta, Map<String, DatasourceStructure.Table> tablesByName,
                                Map<String, DatasourceStructure.Key> keyRegistry) {
            final String constraintName = row.get("constraint_name", String.class);
            final char constraintType = row.get("constraint_type", String.class).charAt(0);
            final String selfSchema = row.get("self_schema", String.class);
            final String tableName = row.get("self_table", String.class);


            if (!tablesByName.containsKey(tableName)) {
                /* do nothing */
                return;
            }

            final DatasourceStructure.Table table = tablesByName.get(tableName);
            final String keyFullName = tableName + "." + row.get("constraint_name", String.class);

            if (constraintType == 'p') {
                if (!keyRegistry.containsKey(keyFullName)) {
                    final DatasourceStructure.PrimaryKey key = new DatasourceStructure.PrimaryKey(
                            constraintName,
                            new ArrayList<>()
                    );
                    keyRegistry.put(keyFullName, key);
                    table.getKeys().add(key);
                }
                ((DatasourceStructure.PrimaryKey) keyRegistry.get(keyFullName)).getColumnNames()
                        .add(row.get("self_column", String.class));
            } else if (constraintType == 'f') {
                final String foreignSchema = row.get("foreign_schema", String.class);
                final String prefix = (foreignSchema.equalsIgnoreCase(selfSchema) ? "" : foreignSchema + ".")
                        + row.get("foreign_table", String.class) + ".";

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
                        .add(row.get("self_column", String.class));
                ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName)).getToColumns()
                        .add(prefix + row.get("foreign_column", String.class));
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
                    } else if (type.startsWith("double")) {
                        value = "1.0";
                    } else if (DATE_COLUMN_TYPE_NAME.equals(type)) {
                        value = "'2019-07-01'";
                    } else if (DATETIME_COLUMN_TYPE_NAME.equals(type)
                            || TIMESTAMP_COLUMN_TYPE_NAME.equals(type)) {
                        value = "'2019-07-01 10:00:00'";
                    } else {
                        value = "''";
                    }

                    columnNames.add(name);
                    columnValues.add(value);
                    setFragments.append("\n    ").append(name).append(" = ").append(value);
                }

                final String tableName = table.getName();
                table.getTemplates().addAll(List.of(
                        new DatasourceStructure.Template("SELECT", "SELECT * FROM " + tableName + " LIMIT 10;"),
                        new DatasourceStructure.Template("INSERT", "INSERT INTO " + tableName
                                + " (" + String.join(", ", columnNames) + ")\n"
                                + "  VALUES (" + String.join(", ", columnValues) + ");"),
                        new DatasourceStructure.Template("UPDATE", "UPDATE " + tableName + " SET"
                                + setFragments.toString() + "\n"
                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                        new DatasourceStructure.Template("DELETE", "DELETE FROM " + tableName
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

            return Flux.from(connection.createStatement(COLUMNS_QUERY).execute())
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
