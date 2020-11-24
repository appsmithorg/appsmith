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
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import io.r2dbc.spi.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.reactivestreams.Publisher;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
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

            String query = actionConfiguration.getBody();

            if (query == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required parameter: Query."));
            }

            final List<Map<String, Object>> rowsList = new ArrayList<>(50);

            return Flux.from(connection.createStatement(query).execute())
                    .flatMap(result -> {
                        return result.map((row, meta) -> {
                            Iterator<ColumnMetadata> iterator = (Iterator<ColumnMetadata>) meta.getColumnMetadatas().iterator();
                            Map<String, Object> processedRow = new LinkedHashMap<>();

                            while(iterator.hasNext()) {
                                ColumnMetadata metaData = iterator.next();
                                String columnName = metaData.getName();
                                String typeName = metaData.getJavaType().toString();
                                Object columnValue = null;

                                if(DATE_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    columnValue = DateTimeFormatter.ISO_DATE.format(row.get(columnName,
                                            LocalDate.class));
                                }
                                else if (DATETIME_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)
                                        || TIMESTAMP_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    columnValue = DateTimeFormatter.ISO_DATE_TIME.format(
                                            LocalDateTime.of(
                                                    row.get(columnName, LocalDateTime.class).toLocalDate(),
                                                    row.get(columnName, LocalDateTime.class).toLocalTime()
                                            )
                                    ) + "Z";
                                }
                                else if ("year".equalsIgnoreCase(typeName)) {
                                    columnValue = row.get(columnName, LocalDate.class).getYear();
                                }
                                else {
                                    columnValue = row.get(columnName);
                                }

                                processedRow.put(columnName, columnValue);
                            }

                            rowsList.add(processedRow);

                            return result;
                        });
                    })
                    .collectList()
                    .flatMap(execResult -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setBody(objectMapper.valueToTree(rowsList));
                        result.setIsExecutionSuccess(true);
                        log.debug("In the MySqlPlugin, got action execution result: " + result.toString());
                        return Mono.just(result);
                    })
                    .subscribeOn(Schedulers.elastic());
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();

            com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();

            Properties properties = new Properties();

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
            Publisher<Connection> connection = (Publisher<Connection>) ConnectionFactories.get(ob.build()).create();

            return Mono.from(connection)
                    .subscribeOn(Schedulers.elastic());
        }

        @Override
        public void datasourceDestroy(Connection connection) {
            //TODO: catch exception and log it.
            if (connection != null) {
                Mono.from(connection.close())
                        .subscribeOn(Schedulers.elastic())
                        .subscribe();
            }

            return;
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
                        log.warn("Error when testing MySQL datasource.", error);
                        return Mono.just(new DatasourceTestResult(error.getMessage()));
                    });
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Connection connection, DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();

            return Mono.from(connection.createStatement(COLUMNS_QUERY).execute())
                    .flatMap(result -> {
                        result.map((row, meta) -> {
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

                            return Mono.empty();
                        });

                        return Mono.from(connection.createStatement(KEYS_QUERY).execute());
                    })
                    .flatMap(result -> {
                        result.map((row, meta) -> {
                            final String constraintName = row.get("constraint_name", String.class);
                            final char constraintType = row.get("constraint_type", String.class).charAt(0);
                            final String selfSchema = row.get("self_schema", String.class);
                            final String tableName = row.get("self_table", String.class);


                            if (!tablesByName.containsKey(tableName)) {
                                return Mono.empty();
                            }

                            final DatasourceStructure.Table table = tablesByName.get(tableName);
                            final String keyFullName = tableName + "." + row.get("constraint_name", String.class);
                            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

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
                            }
                            else if (constraintType == 'f') {
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

                            return Mono.empty();
                        });

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

                        structure.setTables(new ArrayList<>(tablesByName.values()));
                        for (DatasourceStructure.Table table : structure.getTables()) {
                            table.getKeys().sort(Comparator.naturalOrder());
                        }

                        return Mono.just(structure);
                    })
                    .onErrorResume(error -> {
                        return Mono.error(Exceptions.propagate(error));
                    })
                    .subscribeOn(Schedulers.elastic());
        }
    }
}