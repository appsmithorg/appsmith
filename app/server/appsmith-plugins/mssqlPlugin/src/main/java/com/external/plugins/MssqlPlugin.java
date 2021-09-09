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
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static com.appsmith.external.models.Connection.Mode.READ_ONLY;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

public class MssqlPlugin extends BasePlugin {

    private static final String JDBC_DRIVER = "com.microsoft.sqlserver.jdbc.SQLServerDriver";

    private static final int VALIDITY_CHECK_TIMEOUT = 5;

    private static final String DATE_COLUMN_TYPE_NAME = "date";

    public MssqlPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /**
     * MsSQL plugin receives the query as json of the following format :
     */

    @Slf4j
    @Extension
    public static class MssqlPluginExecutor implements PluginExecutor<Connection>, SmartSubstitutionInterface {

        private final Scheduler scheduler = Schedulers.elastic();

        private static final int PREPARED_STATEMENT_INDEX = 0;

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
        public Mono<ActionExecutionResult> executeParameterized(Connection connection,
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
                // In case the prepared statement configuration is missing, default to true
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
                return executeCommon(connection, actionConfiguration, FALSE, null, null);
            }

            //Prepared Statement
            // First extract all the bindings in order
            List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
            // Replace all the bindings with a ? as expected in a prepared statement.
            String updatedQuery = MustacheHelper.replaceMustacheWithQuestionMark(query, mustacheKeysInOrder);
            actionConfiguration.setBody(updatedQuery);
            return executeCommon(connection, actionConfiguration, TRUE, mustacheKeysInOrder, executeActionDTO);
        }

        public Mono<ActionExecutionResult> executeCommon(Connection connection,
                                                         ActionConfiguration actionConfiguration,
                                                         Boolean preparedStatement,
                                                         List<String> mustacheValuesInOrder,
                                                         ExecuteActionDTO executeActionDTO) {

            final Map<String, Object> requestData = new HashMap<>();
            requestData.put("preparedStatement", TRUE.equals(preparedStatement) ? true : false);

            String query = actionConfiguration.getBody();
            Map<String, Object> psParams = preparedStatement ? new LinkedHashMap<>() : null;
            String transformedQuery = preparedStatement ? replaceQuestionMarkWithDollarIndex(query) : query;
            List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                    transformedQuery, null, null, psParams));

            return Mono.fromCallable(() -> {
                try {
                    if (connection == null || connection.isClosed() || !connection.isValid(VALIDITY_CHECK_TIMEOUT)) {
                        log.info("Encountered stale connection in MsSQL plugin. Reporting back.");
                        return Mono.error(new StaleConnectionException());
                    }
                } catch (SQLException error) {
                    // This exception is thrown only when the timeout to `isValid` is negative. Since, that's not the case,
                    // here, this should never happen.
                    log.error("Error checking validity of MsSQL connection.", error);
                }

                if (query == null) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Missing required " +
                            "parameter: Query."));
                }

                List<Map<String, Object>> rowsList = new ArrayList<>(50);
                final List<String> columnsList = new ArrayList<>();

                Statement statement = null;
                PreparedStatement preparedQuery = null;
                ResultSet resultSet = null;
                boolean isResultSet;

                try {
                    if (FALSE.equals(preparedStatement)) {
                        statement = connection.createStatement();
                        isResultSet = statement.execute(query);
                        resultSet = statement.getResultSet();
                    } else {
                        preparedQuery = connection.prepareStatement(query);

                        List<Map.Entry<String, String>> parameters = new ArrayList<>();
                        preparedQuery = (PreparedStatement) smartSubstitutionOfBindings(preparedQuery,
                                mustacheValuesInOrder,
                                executeActionDTO.getParams(),
                                parameters);

                        requestData.put("ps-parameters", parameters);

                        IntStream.range(0, parameters.size())
                                .forEachOrdered(i ->
                                        psParams.put(
                                                getPSParamLabel(i+1),
                                                new PsParameterDTO(parameters.get(i).getKey(), parameters.get(i).getValue())));

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

                    }

                } catch (SQLException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, e.getMessage()));

                } finally {
                    if (resultSet != null) {
                        try {
                            resultSet.close();
                        } catch (SQLException e) {
                            log.warn("Error closing MsSQL ResultSet", e);
                        }
                    }

                    if (statement != null) {
                        try {
                            statement.close();
                        } catch (SQLException e) {
                            log.warn("Error closing MsSQL Statement", e);
                        }
                    }

                    if (preparedQuery != null) {
                        try {
                            preparedQuery.close();
                        } catch (SQLException e) {
                            log.warn("Error closing MsSQL Statement", e);
                        }
                    }

                }

                ActionExecutionResult result = new ActionExecutionResult();
                result.setBody(objectMapper.valueToTree(rowsList));
                result.setMessages(populateHintMessages(columnsList));
                result.setIsExecutionSuccess(true);
                System.out.println(Thread.currentThread().getName() + ": In the MssqlPlugin, got action execution result");
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

        private  Set<String> populateHintMessages(List<String> columnNames) {

            Set<String> messages = new HashSet<>();

            List<String> identicalColumns = getIdenticalColumns(columnNames);
            if(!CollectionUtils.isEmpty(identicalColumns)) {
                messages.add("Your MsSQL query result may not have all the columns because duplicate column names " +
                        "were found for the column(s): " + String.join(", ", identicalColumns) + ". You may use the " +
                        "SQL keyword 'as' to rename the duplicate column name(s) and resolve this issue.");
            }

            return messages;
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return (Mono<Connection>) Mono.fromCallable(() -> {
                try {
                    Class.forName(JDBC_DRIVER);
                } catch (ClassNotFoundException e) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Error loading MsSQL JDBC Driver class."
                    ));
                }

                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

                com.appsmith.external.models.Connection configurationConnection = datasourceConfiguration.getConnection();

                final boolean isSslEnabled = configurationConnection != null
                        && configurationConnection.getSsl() != null
                        && !SSLDetails.AuthType.NO_SSL.equals(configurationConnection.getSsl().getAuthType());

                StringBuilder urlBuilder = new StringBuilder("jdbc:sqlserver://");
                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    urlBuilder
                            .append(endpoint.getHost())
                            .append(":")
                            .append(ObjectUtils.defaultIfNull(endpoint.getPort(), 5432L))
                            .append(";");
                }

                if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                    urlBuilder
                            .append("database=")
                            .append(authentication.getDatabaseName())
                            .append(";");
                }

                if (!StringUtils.isEmpty(authentication.getUsername())) {
                    urlBuilder
                            .append("user=")
                            .append(authentication.getUsername())
                            .append(";");
                }

                if (!StringUtils.isEmpty(authentication.getPassword())) {
                    urlBuilder
                            .append("password=")
                            .append(authentication.getPassword())
                            .append(";");
                }

                urlBuilder
                        .append("encrypt=")
                        .append(isSslEnabled)
                        .append(";");

                try {
                    Connection connection = DriverManager.getConnection(urlBuilder.toString());
                    connection.setReadOnly(
                            configurationConnection != null && READ_ONLY.equals(configurationConnection.getMode()));
                    System.out.println(Thread.currentThread().getName() + ": Connected to MS-SQL Database");
                    return Mono.just(connection);

                } catch (SQLException e) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Error connecting to MsSQL: " + e.getMessage()
                    ));
                }
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(Connection connection) {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                log.error("Error closing MsSQL Connection.", e);
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

            DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
            if (auth == null) {
                invalids.add("Missing authentication details.");

            } else {
                if (StringUtils.isEmpty(auth.getUsername())) {
                    invalids.add("Missing username for authentication.");
                }

                if (StringUtils.isEmpty(auth.getPassword())) {
                    invalids.add("Missing password for authentication.");
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
                            log.warn("Error closing MsSQL connection that was made for testing.", e);
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) throws AppsmithPluginException {

            PreparedStatement preparedStatement = (PreparedStatement) input;
            DataType valueType = DataTypeStringUtils.stringToKnownDataTypeConverter(value);

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
                        throw new IllegalArgumentException("Array datatype is not supported in MS SQL");
                    }
                    case STRING: {
                        preparedStatement.setString(index, value);
                        break;
                    }
                    default:
                        break;
                }

            } catch (SQLException | IllegalArgumentException | IOException e) {
                String message = "Query preparation failed while inserting value: "
                        + value + " for binding: {{" + binding + "}}. Please check the query again.\nError: " + e.getMessage();
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, message);
            }

            return preparedStatement;
        }

    }

}
