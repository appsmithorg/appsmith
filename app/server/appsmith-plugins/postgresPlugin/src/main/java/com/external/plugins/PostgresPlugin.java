package com.external.plugins;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.external.services.SharedConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import com.zaxxer.hikari.pool.HikariPool.PoolInitializationException;
import com.zaxxer.hikari.pool.HikariProxyConnection;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.postgresql.util.PGobject;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Array;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.Sizeof.sizeof;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.BOOL;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.DATE;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.DECIMAL;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.FLOAT8;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.INT4;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.INT8;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.TIME;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.VARCHAR;
import static com.external.plugins.utils.PostgresDataTypeUtils.extractExplicitCasting;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

public class PostgresPlugin extends BasePlugin {

    static final String JDBC_DRIVER = "org.postgresql.Driver";

    private static final String DATE_COLUMN_TYPE_NAME = "date";

    private static final String TIMESTAMP_TYPE_NAME = "timestamp";

    private static final String TIMESTAMPTZ_TYPE_NAME = "timestamptz";

    private static final String TIME_TYPE_NAME = "time";

    private static final String TIMETZ_TYPE_NAME = "timetz";

    private static final String INTERVAL_TYPE_NAME = "interval";

    private static final String JSON_TYPE_NAME = "json";

    private static final String JSONB_TYPE_NAME = "jsonb";

    private static final int MINIMUM_POOL_SIZE = 1;

    private static final int MAXIMUM_POOL_SIZE = 5;

    private static final long LEAK_DETECTION_TIME_MS = 60 * 1000;

    private static final int HEAVY_OP_FREQUENCY = 100;

    private static int MAX_SIZE_SUPPORTED;

    public PostgresPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class PostgresPluginExecutor implements SmartSubstitutionInterface, PluginExecutor<HikariDataSource> {

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

        private static final int PREPARED_STATEMENT_INDEX = 0;

        private final SharedConfig sharedConfig;

        public PostgresPluginExecutor(SharedConfig sharedConfig) {
            this.sharedConfig = sharedConfig;
            MAX_SIZE_SUPPORTED = sharedConfig.getMaxResponseSize();
        }


        /**
         * Instead of using the default executeParametrized provided by pluginExecutor, this implementation affords an opportunity
         * to use PreparedStatement (if configured) which requires the variable substitution, etc. to happen in a particular format
         * supported by PreparedStatement. In case of PreparedStatement turned off, the action and datasource configurations are
         * prepared (binding replacement) using PluginExecutor.variableSubstitution
         *
         * @param connection              : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param executeActionDTO        : This is the data structure sent by the client during execute. This contains the params
         *                                which would be used for substitution
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         * @return
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(HikariDataSource connection,
                                                                ExecuteActionDTO executeActionDTO,
                                                                DatasourceConfiguration datasourceConfiguration,
                                                                ActionConfiguration actionConfiguration) {

            String query = actionConfiguration.getBody();
            // Check for query parameter before performing the probably expensive fetch connection from the pool op.
            if (query == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Missing required " +
                        "parameter: Query."));
            }

            Boolean isPreparedStatement;

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            if (properties == null || properties.get(PREPARED_STATEMENT_INDEX) == null) {
                //In case the prepared statement configuration is missing, default to true.
                isPreparedStatement = true;
            } else if (properties.get(PREPARED_STATEMENT_INDEX) != null){
                Object psValue = properties.get(PREPARED_STATEMENT_INDEX).getValue();
                if (psValue instanceof  Boolean) {
                    isPreparedStatement = (Boolean) psValue;
                } else if (psValue instanceof String) {
                    isPreparedStatement = Boolean.parseBoolean((String) psValue);
                } else {
                    isPreparedStatement = true;
                }
            } else {
                isPreparedStatement = true;
            }

            // In case of non prepared statement, simply do binding replacement and execute
            if (FALSE.equals(isPreparedStatement)) {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
                return executeCommon(connection, datasourceConfiguration, actionConfiguration, FALSE, null, null, null);
            }

            // Prepared Statement

            // First extract all the bindings in order
            List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
            // Replace all the bindings with a ? as expected in a prepared statement.
            String updatedQuery = MustacheHelper.replaceMustacheWithQuestionMark(query, mustacheKeysInOrder);
            List<DataType> explicitCastDataTypes = extractExplicitCasting(updatedQuery);
            actionConfiguration.setBody(updatedQuery);
            return executeCommon(connection, datasourceConfiguration, actionConfiguration, TRUE,
                    mustacheKeysInOrder, executeActionDTO, explicitCastDataTypes);
        }

        private Mono<ActionExecutionResult> executeCommon(HikariDataSource connection,
                                                          DatasourceConfiguration datasourceConfiguration,
                                                          ActionConfiguration actionConfiguration,
                                                          Boolean preparedStatement,
                                                          List<String> mustacheValuesInOrder,
                                                          ExecuteActionDTO executeActionDTO,
                                                          List<DataType> explicitCastDataTypes) {

            final Map<String, Object> requestData = new HashMap<>();
            requestData.put("preparedStatement", TRUE.equals(preparedStatement) ? true : false);

            String query = actionConfiguration.getBody();
            Map<String, Object> psParams = preparedStatement ? new LinkedHashMap<>() : null;
            String transformedQuery = preparedStatement ? replaceQuestionMarkWithDollarIndex(query) : query;
            List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                    transformedQuery, null, null, psParams));

            return Mono.fromCallable(() -> {

                Connection connectionFromPool;

                try {
                    connectionFromPool = getConnectionFromConnectionPool(connection, datasourceConfiguration);
                } catch (SQLException | StaleConnectionException e) {
                    // The function can throw either StaleConnectionException or SQLException. The underlying hikari
                    // library throws SQLException in case the pool is closed or there is an issue initializing
                    // the connection pool which can also be translated in our world to StaleConnectionException
                    // and should then trigger the destruction and recreation of the pool.
                    return Mono.error(e instanceof StaleConnectionException ? e : new StaleConnectionException());
                }

                List<Map<String, Object>> rowsList = new ArrayList<>(50);
                final List<String> columnsList = new ArrayList<>();

                Statement statement = null;
                ResultSet resultSet = null;
                PreparedStatement preparedQuery = null;
                boolean isResultSet;

                HikariPoolMXBean poolProxy = connection.getHikariPoolMXBean();

                int idleConnections = poolProxy.getIdleConnections();
                int activeConnections = poolProxy.getActiveConnections();
                int totalConnections = poolProxy.getTotalConnections();
                int threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                System.out.println(Thread.currentThread().getName() + ": Before executing postgres query [" +
                        query +
                        "] Hikari Pool stats : active - " + activeConnections +
                        ", idle - " + idleConnections +
                        ", awaiting - " + threadsAwaitingConnection +
                        ", total - " + totalConnections);
                try {
                    if (FALSE.equals(preparedStatement)) {
                        statement = connectionFromPool.createStatement();
                        isResultSet = statement.execute(query);
                        resultSet = statement.getResultSet();
                    } else {
                        preparedQuery = connectionFromPool.prepareStatement(query);

                        List<Map.Entry<String, String>> parameters = new ArrayList<>();
                        preparedQuery = (PreparedStatement) smartSubstitutionOfBindings(preparedQuery,
                                mustacheValuesInOrder,
                                executeActionDTO.getParams(),
                                parameters,
                                connectionFromPool,
                                explicitCastDataTypes);

                        IntStream.range(0, parameters.size())
                                .forEachOrdered(i ->
                                        psParams.put(
                                                getPSParamLabel(i+1),
                                                new PsParameterDTO(parameters.get(i).getKey(),parameters.get(i).getValue())));

                        requestData.put("ps-parameters", parameters);
                        isResultSet = preparedQuery.execute();
                        resultSet = preparedQuery.getResultSet();
                    }

                    if (!isResultSet) {

                        Object updateCount = FALSE.equals(preparedStatement) ?
                                ObjectUtils.defaultIfNull(statement.getUpdateCount(), 0) :
                                ObjectUtils.defaultIfNull(preparedQuery.getUpdateCount(), 0);

                        rowsList.add(Map.of("affectedRows", updateCount));

                    } else {

                        ResultSetMetaData metaData = resultSet.getMetaData();
                        int colCount = metaData.getColumnCount();
                        columnsList.addAll(getColumnsListForJdbcPlugin(metaData));

                        int iterator = 0;
                        while (resultSet.next()) {

                            // Only check the data size at low frequency to ensure the performance is not impacted heavily
                            if (iterator% HEAVY_OP_FREQUENCY == 0) {
                                int objectSize = sizeof(rowsList);

                                if (objectSize > MAX_SIZE_SUPPORTED) {
                                    System.out.println(Thread.currentThread().getName() +
                                            "[PostgresPlugin] Result size greater than maximum supported size of "
                                            + MAX_SIZE_SUPPORTED + "bytes. Current size : " + objectSize);
                                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_MAX_RESULT_SIZE_EXCEEDED, (float) (MAX_SIZE_SUPPORTED / (1024 * 1024))));
                                }
                            }

                            // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                            Map<String, Object> row = new LinkedHashMap<>(colCount);

                            for (int i = 1; i <= colCount; i++) {
                                Object value;
                                final String typeName = metaData.getColumnTypeName(i);

                                if (resultSet.getObject(i) == null) {
                                    value = null;

                                } else if (DATE_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    value = DateTimeFormatter.ISO_DATE.format(resultSet.getDate(i).toLocalDate());

                                } else if (TIMESTAMP_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    value = DateTimeFormatter.ISO_DATE_TIME.format(
                                            LocalDateTime.of(
                                                    resultSet.getDate(i).toLocalDate(),
                                                    resultSet.getTime(i).toLocalTime()
                                            )
                                    ) + "Z";

                                } else if (TIMESTAMPTZ_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    value = DateTimeFormatter.ISO_DATE_TIME.format(
                                            resultSet.getObject(i, OffsetDateTime.class)
                                    );

                                } else if (TIME_TYPE_NAME.equalsIgnoreCase(typeName) || TIMETZ_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    value = resultSet.getString(i);

                                } else if (INTERVAL_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    value = resultSet.getObject(i).toString();

                                } else if (typeName.startsWith("_")) {
                                    value = resultSet.getArray(i).getArray();

                                } else if (JSON_TYPE_NAME.equalsIgnoreCase(typeName)
                                        || JSONB_TYPE_NAME.equalsIgnoreCase(typeName)) {
                                    value = objectMapper.readTree(resultSet.getString(i));
                                } else {
                                    value = resultSet.getObject(i);

                                    /**
                                     * Any type that JDBC does not understand gets mapped to PGobject. PGobject has
                                     * two attributes: type and value. Hence, when PGobject gets serialized, it gets
                                     * converted into a JSON like {"type":"citext", "value":"someText"}. Since we are
                                     * only interested in the value and not the type, it makes sense to extract out
                                     * the value as a string.
                                     * Reference: https://jdbc.postgresql.org/documentation/publicapi/org/postgresql/util/PGobject.html
                                     */
                                    if (value instanceof PGobject) {
                                        value = ((PGobject) value).getValue();
                                    }
                                }

                                row.put(metaData.getColumnName(i), value);
                            }

                            rowsList.add(row);

                            iterator++;
                        }
                    }

                } catch (SQLException e) {
                    System.out.println(Thread.currentThread().getName() + ": In the PostgresPlugin, got action execution error");
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, e.getMessage()));
                } catch (IOException e) {
                    // Since postgres json type field can only hold valid json data, this exception is not expected
                    // to occur.
                    System.out.println(Thread.currentThread().getName() + ": In the PostgresPlugin, got action execution error");
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
                } finally {
                    idleConnections = poolProxy.getIdleConnections();
                    activeConnections = poolProxy.getActiveConnections();
                    totalConnections = poolProxy.getTotalConnections();
                    threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                    System.out.println(Thread.currentThread().getName() + ": After executing postgres query, Hikari Pool stats active - " + activeConnections +
                            ", idle - " + idleConnections +
                            ", awaiting - " + threadsAwaitingConnection +
                            ", total - " + totalConnections);
                    if (resultSet != null) {
                        try {
                            resultSet.close();
                        } catch (SQLException e) {
                            System.out.println(Thread.currentThread().getName() +
                                    ": Execute Error closing Postgres ResultSet" + e.getMessage());
                        }
                    }

                    if (statement != null) {
                        try {
                            statement.close();
                        } catch (SQLException e) {
                            System.out.println(Thread.currentThread().getName() +
                                    ": Execute Error closing Postgres Statement" + e.getMessage());
                        }
                    }

                    if (preparedQuery != null) {
                        try {
                            preparedQuery.close();
                        } catch (SQLException e) {
                            System.out.println(Thread.currentThread().getName() +
                                    ": Execute Error closing Postgres Statement" + e.getMessage());
                        }
                    }

                    if (connectionFromPool != null) {
                        try {
                            // Return the connetion back to the pool
                            connectionFromPool.close();
                        } catch (SQLException e) {
                            System.out.println(Thread.currentThread().getName() +
                                    ": Execute Error returning Postgres connection to pool" + e.getMessage());
                        }
                    }

                }

                ActionExecutionResult result = new ActionExecutionResult();
                result.setBody(objectMapper.valueToTree(rowsList));
                result.setMessages(populateHintMessages(columnsList));
                result.setIsExecutionSuccess(true);
                System.out.println(Thread.currentThread().getName() + ": In the PostgresPlugin, got action execution result");
                return Mono.just(result);
            })
                    .flatMap(obj -> obj)
                    .map(obj -> (ActionExecutionResult) obj)
                    .onErrorResume(error -> {
                        if (error instanceof StaleConnectionException) {
                            return Mono.error(error);
                        }
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned back to the server
                    .map(actionExecutionResult -> {
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(query);
                        request.setProperties(requestData);
                        request.setRequestParams(requestParams);
                        ActionExecutionResult result = actionExecutionResult;
                        result.setRequest(request);
                        return result;
                    })
                    .timeout(Duration.ofMillis(actionConfiguration.getTimeoutInMillisecond()))
                    .subscribeOn(scheduler);

        }

        private Set<String> populateHintMessages(List<String> columnNames) {

            Set<String> messages = new HashSet<>();

            List<String> identicalColumns = getIdenticalColumns(columnNames);
            if (!CollectionUtils.isEmpty(identicalColumns)) {
                messages.add("Your PostgreSQL query result may not have all the columns because duplicate column " +
                        "names were found for the column(s): " + String.join(", ", identicalColumns) + ". You may use" +
                        " the SQL keyword 'as' to rename the duplicate column name(s) and resolve this issue.");
            }

            return messages;
        }

        @Override
        public Mono<ActionExecutionResult> execute(HikariDataSource connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Mono<HikariDataSource> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Error loading Postgres JDBC Driver class."));
            }

            return Mono
                    .fromCallable(() -> {
                        System.out.println(Thread.currentThread().getName() + ": Connecting to Postgres db");
                        return createConnectionPool(datasourceConfiguration);
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(HikariDataSource connection) {
            if (connection != null) {
                connection.close();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
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

            /*
             * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
             */
            if (datasourceConfiguration.getConnection() == null
                    || datasourceConfiguration.getConnection().getSsl() == null
                    || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
                invalids.add("Appsmith server has failed to fetch SSL configuration from datasource configuration form. " +
                        "Please reach out to Appsmith customer support to resolve this.");
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .map(connection -> {
                        if (connection != null) {
                            connection.close();
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(HikariDataSource connection, DatasourceConfiguration datasourceConfiguration) {

            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();

            return Mono.fromSupplier(() -> {

                Connection connectionFromPool;
                try {
                    connectionFromPool = getConnectionFromConnectionPool(connection, datasourceConfiguration);
                } catch (SQLException | StaleConnectionException e) {
                    // The function can throw either StaleConnectionException or SQLException. The underlying hikari
                    // library throws SQLException in case the pool is closed or there is an issue initializing
                    // the connection pool which can also be translated in our world to StaleConnectionException
                    // and should then trigger the destruction and recreation of the pool.
                    return Mono.error(e instanceof StaleConnectionException ? e : new StaleConnectionException());
                }

                HikariPoolMXBean poolProxy = connection.getHikariPoolMXBean();

                int idleConnections = poolProxy.getIdleConnections();
                int activeConnections = poolProxy.getActiveConnections();
                int totalConnections = poolProxy.getTotalConnections();
                int threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                System.out.println(Thread.currentThread().getName() + ": Before getting postgres db structure" +
                        " Hikari Pool stats : active - " + activeConnections +
                        ", idle - " + idleConnections +
                        ", awaiting - " + threadsAwaitingConnection +
                        ", total - " + totalConnections);

                // Ref: <https://docs.oracle.com/en/java/javase/11/docs/api/java.sql/java/sql/DatabaseMetaData.html>.
                try (Statement statement = connectionFromPool.createStatement()) {

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
                                        schemaName,
                                        fullTableName,
                                        new ArrayList<>(),
                                        new ArrayList<>(),
                                        new ArrayList<>()
                                ));
                            }
                            final DatasourceStructure.Table table = tablesByName.get(fullTableName);
                            final String defaultExpr = columnsResultSet.getString("default_expr");
                            boolean isAutogenerated = !StringUtils.isEmpty(defaultExpr) && defaultExpr.toLowerCase().contains("nextval");

                            table.getColumns().add(new DatasourceStructure.Column(
                                    columnsResultSet.getString("name"),
                                    columnsResultSet.getString("column_type"),
                                    defaultExpr,
                                    isAutogenerated
                                )
                            );
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
                            } else if (type.startsWith("float") || type.startsWith("double")) {
                                value = "1.0";
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
                            } else if (type.startsWith("_int")) {
                                value = "'{1, 2, 3}'";
                            } else if ("_varchar".equals(type)) {
                                value = "'{\"first\", \"second\"}'";
                            } else {
                                value = "''";
                            }

                            columnNames.add("\"" + name + "\"");
                            columnValues.add(value);
                            setFragments.append("\n    \"").append(name).append("\" = ").append(value).append(",");
                        }

                        // Delete the last comma
                        if (setFragments.length() > 0) {
                            setFragments.deleteCharAt(setFragments.length() - 1);
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
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            throwable.getMessage()
                    ));
                } finally {
                    idleConnections = poolProxy.getIdleConnections();
                    activeConnections = poolProxy.getActiveConnections();
                    totalConnections = poolProxy.getTotalConnections();
                    threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                    System.out.println(Thread.currentThread().getName() + ": After postgres db structure, Hikari Pool stats active - " + activeConnections +
                            ", idle - " + idleConnections +
                            ", awaiting - " + threadsAwaitingConnection +
                            ", total - " + totalConnections);

                    if (connectionFromPool != null) {
                        try {
                            // Return the connection back to the pool
                            connectionFromPool.close();
                        } catch (SQLException e) {
                            System.out.println(Thread.currentThread().getName() +
                                    ": Error returning Postgres connection to pool during get structure" + e.getMessage());
                        }
                    }
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

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) throws AppsmithPluginException {

            PreparedStatement preparedStatement = (PreparedStatement) input;
            HikariProxyConnection connection = (HikariProxyConnection) args[0];
            List<DataType> explicitCastDataTypes = (List<DataType>) args[1];
            DataType valueType;
            // If explicitly cast, set the user specified data type
            if (explicitCastDataTypes != null && explicitCastDataTypes.get(index - 1) != null) {
                valueType = explicitCastDataTypes.get(index - 1);
            } else {
                valueType = DataTypeStringUtils.stringToKnownDataTypeConverter(value);
            }

            Map.Entry<String, String> parameter = new SimpleEntry<>(value, valueType.toString());
            insertedParams.add(parameter);

            try {
                switch (valueType) {
                    case NULL: {
                        preparedStatement.setNull(index, Types.NULL);
                        break;
                    }
                    case BINARY: {
                        preparedStatement.setBinaryStream(index, IOUtils.toInputStream(value));
                        break;
                    }
                    case BYTES: {
                        preparedStatement.setBytes(index, value.getBytes("UTF-8"));
                        break;
                    }
                    case INTEGER: {
                        preparedStatement.setInt(index, Integer.parseInt(value));
                        break;
                    }
                    case LONG: {
                        preparedStatement.setLong(index, Long.parseLong(value));
                        break;
                    }
                    case FLOAT:
                    case DOUBLE: {
                        preparedStatement.setBigDecimal(index, new BigDecimal(String.valueOf(value)));
                        break;
                    }
                    case BOOLEAN: {
                        preparedStatement.setBoolean(index, Boolean.parseBoolean(value));
                        break;
                    }
                    case DATE: {
                        preparedStatement.setDate(index, Date.valueOf(value));
                        break;
                    }
                    case TIME: {
                        preparedStatement.setTime(index, Time.valueOf(value));
                        break;
                    }
                    case TIMESTAMP: {
                        preparedStatement.setTimestamp(index, Timestamp.valueOf(value));
                        break;
                    }
                    case ARRAY: {
                        List arrayListFromInput = objectMapper.readValue(value, List.class);
                        if (arrayListFromInput.isEmpty()) {
                            break;
                        }
                        // Find the type of the entries in the list
                        Object firstEntry = arrayListFromInput.get(0);
                        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter((String.valueOf(firstEntry)));
                        String typeName = toPostgresqlPrimitiveTypeName(dataType);

                        // Create the Sql Array and set it.
                        Array inputArray = connection.createArrayOf(typeName, arrayListFromInput.toArray());
                        preparedStatement.setArray(index, inputArray);
                        break;
                    }
                    case STRING: {
                    }
                    case JSON_OBJECT: {
                        preparedStatement.setString(index, value);
                        break;
                    }
                    default:
                        break;
                }

            } catch (SQLException | IllegalArgumentException | IOException e) {
                if ((e instanceof SQLException) && e.getMessage().contains("The column index is out of range:")) {
                    // In case the parameter being set is out of range, then this must be getting set in the commented part of
                    // the query. Ignore the exception
                } else {
                    String message = "Query preparation failed while inserting value: "
                            + value + " for binding: {{" + binding + "}}. Please check the query again.\nError: " + e.getMessage();
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, message);
                }
            }

            return preparedStatement;

        }

        private static String toPostgresqlPrimitiveTypeName(DataType type) {
            switch (type) {
                case LONG:
                    return INT8;
                case INTEGER:
                    return INT4;
                case FLOAT:
                    return DECIMAL;
                case STRING:
                    return VARCHAR;
                case BOOLEAN:
                    return BOOL;
                case DATE:
                    return DATE;
                case TIME:
                    return TIME;
                case DOUBLE:
                    return FLOAT8;
                case ARRAY:
                    throw new IllegalArgumentException("Array of Array datatype is not supported.");
                default:
                    throw new IllegalArgumentException("Unable to map the computed data type to primitive Postgresql type");
            }
        }
    }

    /**
     * This function is blocking in nature which connects to the database and creates a connection pool
     *
     * @param datasourceConfiguration
     * @return connection pool
     */
    private static HikariDataSource createConnectionPool(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
        HikariConfig config = new HikariConfig();

        config.setDriverClassName(JDBC_DRIVER);

        // Set SSL property
        com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();
        config.setMinimumIdle(MINIMUM_POOL_SIZE);
        config.setMaximumPoolSize(MAXIMUM_POOL_SIZE);

        // Set authentication properties
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        if (authentication.getUsername() != null) {
            config.setUsername(authentication.getUsername());
        }
        if (authentication.getPassword() != null) {
            config.setPassword(authentication.getPassword());
        }

        // Set up the connection URL
        StringBuilder urlBuilder = new StringBuilder("jdbc:postgresql://");

        List<String> hosts = datasourceConfiguration
                .getEndpoints()
                .stream()
                .map(endpoint -> endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 5432L))
                .collect(Collectors.toList());

        urlBuilder.append(String.join(",", hosts)).append("/");

        if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
            urlBuilder.append(authentication.getDatabaseName());
        }

        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server has failed to fetch SSL configuration from datasource configuration form. " +
                            "Please reach out to Appsmith customer support to resolve this."
            );
        }

        /*
         * - By default, the driver configures SSL in the preferred mode.
         */
        SSLDetails.AuthType sslAuthType = datasourceConfiguration.getConnection().getSsl().getAuthType();
        switch (sslAuthType) {
            case ALLOW:
            case PREFER:
            case REQUIRE:
                config.addDataSourceProperty("ssl", "true");
                config.addDataSourceProperty("sslmode", sslAuthType.toString().toLowerCase());

                break;
            case DISABLE:
                config.addDataSourceProperty("ssl", "false");
                config.addDataSourceProperty("sslmode", sslAuthType.toString().toLowerCase());

                break;
            case DEFAULT:
                /* do nothing - accept default driver setting */

                break;
            default:
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server has found an unexpected SSL option: " + sslAuthType + ". Please reach out to" +
                                " Appsmith customer support to resolve this."
                );
        }

        String url = urlBuilder.toString();
        config.setJdbcUrl(url);

        // Configuring leak detection threshold for 60 seconds. Any connection which hasn't been released in 60 seconds
        // should get tracked (may be falsely for long running queries) as leaked connection
        config.setLeakDetectionThreshold(LEAK_DETECTION_TIME_MS);

        // Set read only mode if applicable
        switch (configurationConnection.getMode()) {
            case READ_WRITE: {
                config.setReadOnly(false);
                break;
            }
            case READ_ONLY: {
                config.setReadOnly(true);
                config.addDataSourceProperty("readOnlyMode", "always");
                break;
            }
        }

        // Now create the connection pool from the configuration
        HikariDataSource datasource = null;
        try {
            datasource = new HikariDataSource(config);
        } catch (PoolInitializationException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    e.getMessage()
            );
        }

        return datasource;
    }

    /**
     * First checks if the connection pool is still valid. If yes, we fetch a connection from the pool and return
     * In case a connection is not available in the pool, SQL Exception is thrown
     *
     * @param connectionPool
     * @return SQL Connection
     */
    private static Connection getConnectionFromConnectionPool(HikariDataSource connectionPool,
                                                         DatasourceConfiguration datasourceConfiguration) throws SQLException {

        if (connectionPool == null || connectionPool.isClosed() || !connectionPool.isRunning()) {
            System.out.println(Thread.currentThread().getName() +
                    ": Encountered stale connection pool in Postgres plugin. Reporting back.");
            throw new StaleConnectionException();
        }

        Connection connection = connectionPool.getConnection();

        com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();
        if (configurationConnection == null) {
            return connection;
        }

        return connection;
    }
}
