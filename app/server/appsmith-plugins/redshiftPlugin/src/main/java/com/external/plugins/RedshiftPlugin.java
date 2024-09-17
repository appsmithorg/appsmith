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
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.external.plugins.exceptions.RedshiftErrorMessages;
import com.external.plugins.exceptions.RedshiftPluginError;
import com.external.utils.RedshiftDatasourceUtils;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
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
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.PluginConstants.PluginName.REDSHIFT_PLUGIN_NAME;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.JDBC_DRIVER_LOADING_ERROR_MSG;
import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.external.utils.RedshiftDatasourceUtils.createConnectionPool;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
public class RedshiftPlugin extends BasePlugin {
    public static final String JDBC_DRIVER = "com.amazon.redshift.jdbc.Driver";
    private static final String DATE_COLUMN_TYPE_NAME = "date";
    public static RedshiftDatasourceUtils redshiftDatasourceUtils = new RedshiftDatasourceUtils();
    public static final Long REDSHIFT_DEFAULT_PORT = 5439L;

    public RedshiftPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class RedshiftPluginExecutor implements PluginExecutor<HikariDataSource> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        private static final String TABLES_QUERY =
                "select a.attname                                                      as name,\n"
                        + "       t1.typname                                                     as column_type,\n"
                        + "       case when a.atthasdef then pg_get_expr(d.adbin, d.adrelid) end as default_expr,\n"
                        + "       c.relkind                                                      as kind,\n"
                        + "       c.relname                                                      as table_name,\n"
                        + "       n.nspname                                                      as schema_name\n"
                        + "from pg_catalog.pg_attribute a\n"
                        + "         left join pg_catalog.pg_type t1 on t1.oid = a.atttypid\n"
                        + "         inner join pg_catalog.pg_class c on a.attrelid = c.oid\n"
                        + "         left join pg_catalog.pg_namespace n on c.relnamespace = n.oid\n"
                        + "         left join pg_catalog.pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum\n"
                        + "where a.attnum > 0\n"
                        + "  and not a.attisdropped\n"
                        + "  and n.nspname not in ('information_schema', 'pg_catalog')\n"
                        + "  and c.relkind in ('r', 'v')\n"
                        + "  and pg_catalog.pg_table_is_visible(a.attrelid)\n"
                        + "order by c.relname, a.attnum;";

        private static final String KEYS_QUERY_PRIMARY_KEY =
                "select tco.constraint_schema as self_schema,\n" + "       tco.constraint_name,\n"
                        + "       kcu.column_name as self_column,\n"
                        + "       kcu.table_name as self_table,\n"
                        + "       'p' as constraint_type\n"
                        + "from information_schema.table_constraints tco\n"
                        + "join information_schema.key_column_usage kcu \n"
                        + "     on kcu.constraint_name = tco.constraint_name\n"
                        + "     and kcu.constraint_schema = tco.constraint_schema\n"
                        + "     and kcu.constraint_name = tco.constraint_name\n"
                        + "where tco.constraint_type = 'PRIMARY KEY'\n"
                        + "order by tco.constraint_schema,\n"
                        + "         tco.constraint_name,\n"
                        + "         kcu.ordinal_position;";

        private static final String KEYS_QUERY_FOREIGN_KEY =
                "select kcu.table_schema as self_schema,\n" + "\t   kcu.table_name as self_table,\n"
                        + "       rel_kcu.table_schema as foreign_schema,\n"
                        + "       rel_kcu.table_name as foreign_table,\n"
                        + "       kcu.column_name as self_column,\n"
                        + "       rel_kcu.column_name as foreign_column,\n"
                        + "       kcu.constraint_name,\n"
                        + "       'f' as constraint_type\n"
                        + "from information_schema.table_constraints tco\n"
                        + "left join information_schema.key_column_usage kcu\n"
                        + "          on tco.constraint_schema = kcu.constraint_schema\n"
                        + "          and tco.constraint_name = kcu.constraint_name\n"
                        + "left join information_schema.referential_constraints rco\n"
                        + "          on tco.constraint_schema = rco.constraint_schema\n"
                        + "          and tco.constraint_name = rco.constraint_name\n"
                        + "left join information_schema.key_column_usage rel_kcu\n"
                        + "          on rco.unique_constraint_schema = rel_kcu.constraint_schema\n"
                        + "          and rco.unique_constraint_name = rel_kcu.constraint_name\n"
                        + "          and kcu.ordinal_position = rel_kcu.ordinal_position\n"
                        + "where tco.constraint_type = 'FOREIGN KEY'\n"
                        + "order by kcu.table_schema,\n"
                        + "         kcu.table_name,\n"
                        + "         kcu.ordinal_position;\n";

        private void checkResultSetValidity(ResultSet resultSet) throws AppsmithPluginException {
            if (resultSet == null) {
                System.out.println("Redshift plugin: getRow: driver failed to fetch result: resultSet is null.");
                throw new AppsmithPluginException(
                        RedshiftPluginError.QUERY_EXECUTION_FAILED, RedshiftErrorMessages.NULL_RESULTSET_ERROR_MSG);
            }
        }

        private Map<String, Object> getRow(ResultSet resultSet) throws SQLException, AppsmithPluginException {
            checkResultSetValidity(resultSet);

            ResultSetMetaData metaData = resultSet.getMetaData();

            /*
             * 1. Ideally metaData is never supposed to be null. Redshift JDBC driver does null check before returning
             *    ResultSetMetaData.
             */
            if (metaData == null) {
                System.out.println("Redshift plugin: getRow: metaData is null. Ideally this is never supposed to "
                        + "happen as the Redshift JDBC driver does a null check before passing this object. This means "
                        + "that something has gone wrong while processing the query result.");
                throw new AppsmithPluginException(
                        RedshiftPluginError.QUERY_EXECUTION_FAILED, RedshiftErrorMessages.NULL_METADATA_ERROR_MSG);
            }

            int colCount = metaData.getColumnCount();
            // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
            Map<String, Object> row = new LinkedHashMap<>(colCount);

            for (int i = 1; i <= colCount; i++) {
                Object value;
                final String typeName = metaData.getColumnTypeName(i);

                if (resultSet.getObject(i) == null) {
                    value = null;

                } else if (DATE_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)) {
                    value = DateTimeFormatter.ISO_DATE.format(
                            resultSet.getDate(i).toLocalDate());

                } else if ("timestamp".equalsIgnoreCase(typeName)) {
                    value = DateTimeFormatter.ISO_DATE_TIME.format(LocalDateTime.of(
                                    resultSet.getDate(i).toLocalDate(),
                                    resultSet.getTime(i).toLocalTime()))
                            + "Z";

                } else if ("timestamptz".equalsIgnoreCase(typeName)) {
                    value = DateTimeFormatter.ISO_DATE_TIME.format(resultSet.getObject(i, OffsetDateTime.class));
                } else if ("time".equalsIgnoreCase(typeName) || "timetz".equalsIgnoreCase(typeName)) {
                    value = resultSet.getString(i);
                } else {
                    value = resultSet.getObject(i);
                }

                row.put(metaData.getColumnName(i), value);
            }

            return row;
        }

        @Override
        public Mono<ActionExecutionResult> execute(
                HikariDataSource connectionPool,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            String printMessage = Thread.currentThread().getName() + ": execute() called for Redshift plugin.";
            System.out.println(printMessage);
            String query = actionConfiguration.getBody();
            List<RequestParamDTO> requestParams =
                    List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY, query, null, null, null));

            if (!StringUtils.hasLength(query)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        RedshiftErrorMessages.QUERY_PARAMETER_MISSING_ERROR_MSG));
            }

            return Mono.fromCallable(() -> {
                        Connection connection = null;
                        try {
                            connection = redshiftDatasourceUtils.getConnectionFromHikariConnectionPool(
                                    connectionPool, REDSHIFT_PLUGIN_NAME);
                        } catch (SQLException | StaleConnectionException e) {
                            e.printStackTrace();

                            /**
                             * When the user configured time limit for the query execution is over, and the query is still
                             * queued in the connectionPool then InterruptedException is thrown as the execution thread is
                             * prepared for termination. This exception is wrapped inside SQLException and hence needs to be
                             * checked via getCause method. This exception does not indicate a Stale connection.
                             */
                            if (e.getCause() != null && e.getCause().getClass().equals(InterruptedException.class)) {
                                return Mono.error(e);
                            }

                            // The function can throw either StaleConnectionException or SQLException. The underlying
                            // hikari
                            // library throws SQLException in case the pool is closed or there is an issue initializing
                            // the connection pool which can also be translated in our world to StaleConnectionException
                            // and should then trigger the destruction and recreation of the pool.
                            return Mono.error(new StaleConnectionException(e.getMessage()));
                        }

                        /**
                         * Keeping this print statement post call to getConnectionFromHikariConnectionPool because it
                         * checks for stale connection pool.
                         */
                        printConnectionPoolStatus(connectionPool, false);

                        List<Map<String, Object>> rowsList = new ArrayList<>(50);
                        final List<String> columnsList = new ArrayList<>();
                        Statement statement = null;
                        ResultSet resultSet = null;

                        try {
                            statement = connection.createStatement();
                            boolean isResultSet = statement.execute(query);

                            if (isResultSet) {
                                resultSet = statement.getResultSet();
                                ResultSetMetaData metaData = resultSet.getMetaData();
                                columnsList.addAll(getColumnsListForJdbcPlugin(metaData));

                                while (resultSet.next()) {
                                    Map<String, Object> row = getRow(resultSet);
                                    rowsList.add(row);
                                }
                            } else {
                                rowsList.add(Map.of(
                                        "affectedRows", ObjectUtils.defaultIfNull(statement.getUpdateCount(), 0)));
                            }
                        } catch (SQLException e) {
                            e.printStackTrace();
                            return Mono.error(new AppsmithPluginException(
                                    RedshiftPluginError.QUERY_EXECUTION_FAILED,
                                    RedshiftErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    e.getMessage(),
                                    "SQLSTATE: " + e.getSQLState()));
                        } finally {
                            if (resultSet != null) {
                                try {
                                    resultSet.close();
                                } catch (SQLException e) {
                                    System.out.println("Error closing Redshift ResultSet");
                                    e.printStackTrace();
                                }
                            }

                            if (statement != null) {
                                try {
                                    statement.close();
                                } catch (SQLException e) {
                                    System.out.println("Error closing Redshift Statement");
                                    e.printStackTrace();
                                }
                            }

                            try {
                                connection.close();
                            } catch (SQLException e) {
                                System.out.println("Error closing Redshift Connection");
                                e.printStackTrace();
                            }
                        }

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setBody(objectMapper.valueToTree(rowsList));
                        result.setMessages(populateHintMessages(columnsList));
                        result.setIsExecutionSuccess(true);
                        System.out.println(Thread.currentThread().getName()
                                + ": In the RedshiftPlugin, got action execution result");
                        return Mono.just(result);
                    })
                    .flatMap(obj -> obj)
                    .map(obj -> (ActionExecutionResult) obj)
                    .onErrorResume(error -> {
                        error.printStackTrace();
                        if (error instanceof StaleConnectionException) {
                            return Mono.error(error);
                        } else if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    RedshiftPluginError.QUERY_EXECUTION_FAILED,
                                    RedshiftErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    error);
                        }
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned to the server
                    .map(actionExecutionResult -> {
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(query);
                        request.setRequestParams(requestParams);
                        ActionExecutionResult result = actionExecutionResult;
                        result.setRequest(request);
                        return result;
                    })
                    .subscribeOn(scheduler);
        }

        public void printConnectionPoolStatus(HikariDataSource connectionPool, boolean isFetchingStructure) {
            String printMessage =
                    Thread.currentThread().getName() + ": printConnectionPoolStatus() called for Redshift plugin.";
            System.out.println(printMessage);
            HikariPoolMXBean poolProxy = connectionPool.getHikariPoolMXBean();
            int idleConnections = poolProxy.getIdleConnections();
            int activeConnections = poolProxy.getActiveConnections();
            int totalConnections = poolProxy.getTotalConnections();
            int threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
            System.out.println(Thread.currentThread().getName()
                    + (isFetchingStructure
                            ? " Before fetching Redshift db structure."
                            : " Before executing Redshift query.")
                    + " Hikari Pool stats: active - "
                    + activeConnections
                    + ", idle - "
                    + idleConnections
                    + ", awaiting - "
                    + threadsAwaitingConnection
                    + ", total - "
                    + totalConnections);
        }

        private Set<String> populateHintMessages(List<String> columnNames) {

            Set<String> messages = new HashSet<>();

            List<String> identicalColumns = getIdenticalColumns(columnNames);
            if (!CollectionUtils.isEmpty(identicalColumns)) {
                messages.add("Your Redshift query result may not have all the columns because duplicate column names "
                        + "were found for the column(s): "
                        + String.join(", ", identicalColumns) + ". You may use the "
                        + "SQL keyword 'as' to rename the duplicate column name(s) and resolve this issue.");
            }

            return messages;
        }

        @Override
        public Mono<HikariDataSource> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": datasourceCreate() called for Redshift plugin.";
            System.out.println(printMessage);
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        JDBC_DRIVER_LOADING_ERROR_MSG,
                        e.getMessage()));
            }

            return Mono.fromCallable(() -> {
                        System.out.println(Thread.currentThread().getName() + ": Connecting to Redshift db");
                        return createConnectionPool(datasourceConfiguration);
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(HikariDataSource connectionPool) {
            String printMessage =
                    Thread.currentThread().getName() + ": datasourceDestroy() called for Redshift plugin.";
            System.out.println(printMessage);
            if (connectionPool != null) {
                connectionPool.close();
            }
        }

        @Override
        public Set<String> validateDatasource(@NonNull DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": validateDatasource() called for Redshift plugin.";
            System.out.println(printMessage);
            Set<String> invalids = new HashSet<>();

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add("Missing endpoint.");
            } else {
                for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    if (StringUtils.isEmpty(endpoint.getHost())) {
                        invalids.add("Missing hostname.");
                    } else if (endpoint.getHost().contains("/")
                            || endpoint.getHost().contains(":")) {
                        invalids.add(
                                "Host value cannot contain `/` or `:` characters. Found `" + endpoint.getHost() + "`.");
                    }
                }
            }

            if (datasourceConfiguration.getConnection() != null
                    && datasourceConfiguration.getConnection().getMode() == null) {
                invalids.add("Missing connection mode.");
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

                if (StringUtils.isEmpty(authentication.getDatabaseName())) {
                    invalids.add("Missing database name.");
                }
            }

            return invalids;
        }

        @Override
        public Mono<String> getEndpointIdentifierForRateLimit(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName()
                    + ": getEndpointIdentifierForRateLimit() called for Redshift plugin.";
            System.out.println(printMessage);
            List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
            String identifier = "";
            // When hostname and port both are available, both will be used as identifier
            // When port is not present, default port along with hostname will be used
            // This ensures rate limiting will only be applied if hostname is present
            if (endpoints.size() > 0) {
                String hostName = endpoints.get(0).getHost();
                Long port = endpoints.get(0).getPort();
                if (!isBlank(hostName)) {
                    identifier = hostName + "_" + ObjectUtils.defaultIfNull(port, REDSHIFT_DEFAULT_PORT);
                }
            }
            return Mono.just(identifier);
        }

        private void getTablesInfo(ResultSet columnsResultSet, Map<String, DatasourceStructure.Table> tablesByName)
                throws SQLException, AppsmithPluginException {
            checkResultSetValidity(columnsResultSet);

            while (columnsResultSet.next()) {
                final char kind = columnsResultSet.getString("kind").charAt(0);
                final String schemaName = columnsResultSet.getString("schema_name");
                final String tableName = columnsResultSet.getString("table_name");
                final String fullTableName = schemaName + "." + tableName;
                final String defaultExpr = columnsResultSet.getString("default_expr");
                boolean isAutogenerated = !StringUtils.isEmpty(defaultExpr)
                        && defaultExpr.toLowerCase().contains("identity");
                if (!tablesByName.containsKey(fullTableName)) {
                    tablesByName.put(
                            fullTableName,
                            new DatasourceStructure.Table(
                                    kind == 'r'
                                            ? DatasourceStructure.TableType.TABLE
                                            : DatasourceStructure.TableType.VIEW,
                                    schemaName,
                                    fullTableName,
                                    new ArrayList<>(),
                                    new ArrayList<>(),
                                    new ArrayList<>()));
                }
                final DatasourceStructure.Table table = tablesByName.get(fullTableName);
                table.getColumns()
                        .add(new DatasourceStructure.Column(
                                columnsResultSet.getString("name"),
                                columnsResultSet.getString("column_type"),
                                defaultExpr,
                                isAutogenerated));
            }
        }

        private void getKeysInfo(
                ResultSet constraintsResultSet,
                Map<String, DatasourceStructure.Table> tablesByName,
                Map<String, DatasourceStructure.Key> keyRegistry)
                throws SQLException, AppsmithPluginException {
            checkResultSetValidity(constraintsResultSet);

            while (constraintsResultSet.next()) {
                final String constraintName = constraintsResultSet.getString("constraint_name");
                final char constraintType =
                        constraintsResultSet.getString("constraint_type").charAt(0);
                final String selfSchema = constraintsResultSet.getString("self_schema");
                final String tableName = constraintsResultSet.getString("self_table");
                final String fullTableName = selfSchema + "." + tableName;

                if (!tablesByName.containsKey(fullTableName)) {
                    /* do nothing */
                    return;
                }

                final DatasourceStructure.Table table = tablesByName.get(fullTableName);
                final String keyFullName = tableName + "." + constraintName;

                if (constraintType == 'p') {
                    if (!keyRegistry.containsKey(keyFullName)) {
                        final DatasourceStructure.PrimaryKey key =
                                new DatasourceStructure.PrimaryKey(constraintName, new ArrayList<>());
                        keyRegistry.put(keyFullName, key);
                        table.getKeys().add(key);
                    }
                    ((DatasourceStructure.PrimaryKey) keyRegistry.get(keyFullName))
                            .getColumnNames()
                            .add(constraintsResultSet.getString("self_column"));
                } else if (constraintType == 'f') {
                    final String foreignSchema = constraintsResultSet.getString("foreign_schema");
                    final String prefix = (foreignSchema.equalsIgnoreCase(selfSchema) ? "" : foreignSchema + ".")
                            + constraintsResultSet.getString("foreign_table") + ".";

                    if (!keyRegistry.containsKey(keyFullName)) {
                        final DatasourceStructure.ForeignKey key = new DatasourceStructure.ForeignKey(
                                constraintName, new ArrayList<>(), new ArrayList<>());
                        keyRegistry.put(keyFullName, key);
                        table.getKeys().add(key);
                    }

                    ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName))
                            .getFromColumns()
                            .add(constraintsResultSet.getString("self_column"));
                    ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName))
                            .getToColumns()
                            .add(prefix + constraintsResultSet.getString("foreign_column"));
                }
            }
        }

        private void getTemplates(Map<String, DatasourceStructure.Table> tablesByName) {
            for (DatasourceStructure.Table table : tablesByName.values()) {
                final List<DatasourceStructure.Column> columnsWithoutDefault = table.getColumns().stream()
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
                table.getTemplates()
                        .addAll(List.of(
                                new DatasourceStructure.Template(
                                        "SELECT", "SELECT * FROM " + quotedTableName + " LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO " + quotedTableName
                                                + " (" + String.join(", ", columnNames) + ")\n"
                                                + "  VALUES (" + String.join(", ", columnValues) + ");",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE " + quotedTableName + " SET"
                                                + setFragments.toString() + "\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM " + quotedTableName
                                                + "\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false)));
            }
        }

        @Override
        public Mono<DatasourceStructure> getStructure(
                HikariDataSource connectionPool, DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": getStructure() called for Redshift plugin.";
            System.out.println(printMessage);
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            return Mono.fromSupplier(() -> {
                        Connection connection = null;
                        try {
                            connection = redshiftDatasourceUtils.getConnectionFromHikariConnectionPool(
                                    connectionPool, REDSHIFT_PLUGIN_NAME);
                        } catch (SQLException | StaleConnectionException e) {
                            e.printStackTrace();

                            /**
                             * When the user configured time limit for the query execution is over, and the query is still
                             * queued in the connectionPool then InterruptedException is thrown as the execution thread is
                             * prepared for termination. This exception is wrapped inside SQLException and hence needs to be
                             * checked via getCause method. This exception does not indicate a Stale connection.
                             */
                            if (e.getCause() != null && e.getCause().getClass().equals(InterruptedException.class)) {
                                return Mono.error(e);
                            }

                            // The function can throw either StaleConnectionException or SQLException. The underlying
                            // hikari
                            // library throws SQLException in case the pool is closed or there is an issue initializing
                            // the connection pool which can also be translated in our world to StaleConnectionException
                            // and should then trigger the destruction and recreation of the pool.
                            return Mono.error(new StaleConnectionException(e.getMessage()));
                        }

                        /**
                         * Keeping this print statement post call to getConnectionFromConnectionPool because it checks for
                         * stale connection pool.
                         */
                        printConnectionPoolStatus(connectionPool, true);

                        // Ref:
                        // <https://docs.oracle.com/en/java/javase/11/docs/api/java.sql/java/sql/DatabaseMetaData.html>.
                        System.out.println(Thread.currentThread().getName() + ": Getting Redshift Db structure");
                        try (Statement statement = connection.createStatement()) {

                            // Get tables' schema and fill up their columns.
                            ResultSet columnsResultSet = statement.executeQuery(TABLES_QUERY);
                            getTablesInfo(columnsResultSet, tablesByName);

                            // Get tables' primary key constraints and fill those up.
                            ResultSet primaryKeyConstraintsResultSet = statement.executeQuery(KEYS_QUERY_PRIMARY_KEY);
                            getKeysInfo(primaryKeyConstraintsResultSet, tablesByName, keyRegistry);

                            // Get tables' foreign key constraints and fill those up.
                            ResultSet foreignKeyConstraintsResultSet = statement.executeQuery(KEYS_QUERY_FOREIGN_KEY);
                            getKeysInfo(foreignKeyConstraintsResultSet, tablesByName, keyRegistry);

                            // Get templates for each table and put those in.
                            getTemplates(tablesByName);
                        } catch (SQLException e) {
                            e.printStackTrace();
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                    RedshiftErrorMessages.GET_STRUCTURE_ERROR_MSG,
                                    e.getMessage(),
                                    "SQLSTATE: " + e.getSQLState()));
                        } catch (AppsmithPluginException e) {
                            e.printStackTrace();
                            return Mono.error(e);

                        } finally {
                            try {
                                connection.close();
                            } catch (SQLException e) {
                                System.out.println("Error closing Redshift Connection");
                                e.printStackTrace();
                            }
                        }

                        structure.setTables(new ArrayList<>(tablesByName.values()));

                        for (DatasourceStructure.Table table : structure.getTables()) {
                            table.getKeys().sort(Comparator.naturalOrder());
                        }

                        return structure;
                    })
                    .map(resultStructure -> (DatasourceStructure) resultStructure)
                    .onErrorMap(e -> {
                        if ((e instanceof AppsmithPluginException) || (e instanceof StaleConnectionException)) {
                            return e;
                        }

                        return new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                RedshiftErrorMessages.GET_STRUCTURE_ERROR_MSG,
                                e.getMessage());
                    })
                    .subscribeOn(scheduler);
        }
    }
}
