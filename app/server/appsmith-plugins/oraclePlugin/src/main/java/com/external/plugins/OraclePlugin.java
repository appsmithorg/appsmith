package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.plugins.utils.OracleDatasourceUtils;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.CommonFieldName.BODY;
import static com.appsmith.external.constants.CommonFieldName.PREPARED_STATEMENT;
import static com.appsmith.external.helpers.PluginUtils.OBJECT_TYPE;
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static com.external.plugins.utils.OracleDatasourceUtils.JDBC_DRIVER;
import static com.external.plugins.utils.OracleDatasourceUtils.createConnectionPool;
import static com.external.plugins.utils.OracleDatasourceUtils.getConnectionFromConnectionPool;
import static com.external.plugins.utils.OracleExecuteUtils.closeConnectionPostExecution;
import static com.external.plugins.utils.OracleExecuteUtils.populateRowsAndColumns;
import static com.external.plugins.utils.OracleExecuteUtils.removeSemicolonFromQuery;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Slf4j
public class OraclePlugin extends BasePlugin {

    public OraclePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }
    @Extension
    public static class OraclePluginExecutor implements SmartSubstitutionInterface, PluginExecutor<HikariDataSource> {
        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<HikariDataSource> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Error loading Oracle JDBC Driver class."));
            }

            return Mono
                    .fromCallable(() -> {
                        log.debug(Thread.currentThread().getName() + ": Connecting to Oracle db");
                        return createConnectionPool(datasourceConfiguration);
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(HikariDataSource connection) {
            OracleDatasourceUtils.datasourceDestroy(connection);
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return OracleDatasourceUtils.validateDatasource(datasourceConfiguration);
        }

        @Override
        public Mono<ActionExecutionResult> execute(HikariDataSource connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Mono<ActionExecutionResult> executeParameterized(HikariDataSource connection, ExecuteActionDTO executeActionDTO, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            final Map<String, Object> formData = actionConfiguration.getFormData();
            String query = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE, null);
            // Check for query parameter before performing the probably expensive fetch connection from the pool op.
            if (isEmpty(query)) {
                // Next TBD: update error based on new infra
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Missing required parameter: Query."));
            }

            Boolean isPreparedStatement = TRUE;
            Object preparedStatementObject = getDataValueSafelyFromFormData(formData, PREPARED_STATEMENT,
                    OBJECT_TYPE, TRUE);
            if (preparedStatementObject instanceof Boolean) {
                isPreparedStatement = (Boolean) preparedStatementObject;
            } else if (preparedStatementObject instanceof String) {
                // Older UI configuration used to set this value as a string which may/may not be castable to a boolean
                // directly. This is to ensure we are backward compatible
                isPreparedStatement = Boolean.parseBoolean((String) preparedStatementObject);
            }

            // In case of non-prepared statement, simply do binding-replacement and execute
            if (FALSE.equals(isPreparedStatement)) {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
                return executeCommon(connection, datasourceConfiguration, actionConfiguration, FALSE, null, null);
            }

            // First extract all the bindings in order
            List<MustacheBindingToken> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
            // Replace all the bindings with a ? as expected in a prepared statement.
            String updatedQuery = MustacheHelper.replaceMustacheWithQuestionMark(query, mustacheKeysInOrder);
            updatedQuery = removeSemicolonFromQuery(updatedQuery);
            setDataValueSafelyInFormData(formData, BODY, updatedQuery);
            return executeCommon(connection, datasourceConfiguration, actionConfiguration, TRUE,
                    mustacheKeysInOrder, executeActionDTO);
        }

        private Mono<ActionExecutionResult> executeCommon(HikariDataSource connection,
                                                          DatasourceConfiguration datasourceConfiguration,
                                                          ActionConfiguration actionConfiguration,
                                                          Boolean preparedStatement,
                                                          List<MustacheBindingToken> mustacheValuesInOrder,
                                                          ExecuteActionDTO executeActionDTO) {

            final Map<String, Object> requestData = new HashMap<>();
            requestData.put("preparedStatement", TRUE.equals(preparedStatement) ? true : false);

            final Map<String, Object> formData = actionConfiguration.getFormData();
            String query = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE, null);
            if (isEmpty(query)) {
                // Next TBD: update error based on new error infra
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Missing required parameter: Query."));
            }

            Map<String, Object> psParams = preparedStatement ? new LinkedHashMap<>() : null;
            String transformedQuery = preparedStatement ? replaceQuestionMarkWithDollarIndex(query) : query;
            List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                    transformedQuery, null, null, psParams));

            return Mono.fromCallable(() -> {
                        Connection connectionFromPool;

                        try {
                            connectionFromPool = getConnectionFromConnectionPool(connection);
                        } catch (SQLException | StaleConnectionException e) {
                            // The function can throw either StaleConnectionException or SQLException. The underlying hikari
                            // library throws SQLException in case the pool is closed or there is an issue initializing
                            // the connection pool which can also be translated in our world to StaleConnectionException
                            // and should then trigger the destruction and recreation of the pool.
                            log.debug("Exception Occurred while getting connection from pool" + e.getMessage());
                            e.printStackTrace(System.out);
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
                        log.debug("Before executing Oracle query [{}] : Hikari Pool stats : active - {} , idle - {}, " +
                                        "awaiting - {} , total - {}", query, activeConnections, idleConnections,
                                threadsAwaitingConnection, totalConnections);
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
                                        connectionFromPool);

                                IntStream.range(0, parameters.size())
                                        .forEachOrdered(i ->
                                                psParams.put(
                                                        getPSParamLabel(i+1),
                                                        new PsParameterDTO(parameters.get(i).getKey(),parameters.get(i).getValue())));

                                requestData.put("ps-parameters", parameters);
                                isResultSet = preparedQuery.execute();
                                resultSet = preparedQuery.getResultSet();
                            }

                            populateRowsAndColumns(rowsList, columnsList, resultSet, isResultSet, preparedStatement,
                                    statement, preparedQuery);
                        } catch (SQLException e) {
                            log.debug(Thread.currentThread().getName() + ": In the OraclePlugin, got action execution error");
                            log.debug(e.getMessage());
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, e.getMessage()));
                        } finally {
                            idleConnections = poolProxy.getIdleConnections();
                            activeConnections = poolProxy.getActiveConnections();
                            totalConnections = poolProxy.getTotalConnections();
                            threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                            log.debug("After executing Oracle query [{}] : Hikari Pool stats : active - {} , idle - " +
                                            "{}, awaiting - {} , total - {}", query, activeConnections, idleConnections,
                                    threadsAwaitingConnection, totalConnections);

                            closeConnectionPostExecution(resultSet, statement, preparedQuery, connectionFromPool);
                        }

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setBody(objectMapper.valueToTree(rowsList));
                        result.setMessages(populateHintMessages(columnsList));
                        result.setIsExecutionSuccess(true);
                        log.debug(Thread.currentThread().getName() + ": In the OraclePlugin, got action execution result");
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

        @Override
        public Mono<DatasourceStructure> getStructure(HikariDataSource connection, DatasourceConfiguration datasourceConfiguration) {
            return OracleDatasourceUtils.getStructure(connection, datasourceConfiguration);
        }

        private Set<String> populateHintMessages(List<String> columnNames) {
            Set<String> messages = new HashSet<>();

            List<String> identicalColumns = getIdenticalColumns(columnNames);
            if (!CollectionUtils.isEmpty(identicalColumns)) {
                messages.add("Your OracleSQL query result may not have all the columns because duplicate column " +
                        "names were found for the column(s): " + String.join(", ", identicalColumns) + ". You may use" +
                        " the SQL keyword 'as' to rename the duplicate column name(s) and resolve this issue.");
            }

            return messages;
        }
    }
}
