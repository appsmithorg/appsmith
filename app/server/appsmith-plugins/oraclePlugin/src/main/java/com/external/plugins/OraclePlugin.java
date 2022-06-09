package com.external.plugins;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static io.r2dbc.spi.ConnectionFactoryOptions.SSL;
import static java.lang.Boolean.FALSE;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.stream.IntStream;

import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;

import io.r2dbc.spi.ColumnMetadata;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactoryOptions;
import io.r2dbc.spi.Option;
import io.r2dbc.spi.Result;
import io.r2dbc.spi.Row;
import io.r2dbc.spi.RowMetadata;
import io.r2dbc.spi.Statement;
import io.r2dbc.spi.ValidationDepth;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

/**
 * OraclePlugin
 *
 */
public class OraclePlugin extends BasePlugin {
	
	private static final int VALIDATION_CHECK_TIMEOUT = 4; // seconds

    public OraclePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class OraclePluginExecutor implements SmartSubstitutionInterface, PluginExecutor<Connection> {
    	
    	private final Scheduler scheduler = Schedulers.elastic();
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
	    	/*ConnectionFactory connectionFactory = ConnectionFactories.get(
	    			  "r2dbc:oracle://localhost:1521/testdb");
	
			Mono.from(connectionFactory.create())
			  .flatMapMany(conn ->
			    Flux.from(conn.createStatement(
			      "SELECT 'Hello, Oracle' FROM sys.dual")
			      .execute())
			      .flatMap(result ->
			      result.map((row, meta) -> row.get(0, String.class)))
			      .doOnNext(System.out::println)
			      .thenMany(conn.close()))
			  .subscribe();
			*/
			final Map<String, Object> requestData = new HashMap<>();

            Boolean isPreparedStatement = false;
            requestData.put("preparedStatement", isPreparedStatement);

            String query = actionConfiguration.getBody();
            // Check for query parameter before performing the probably expensive fetch connection from the pool op.
            if (query == null) {
                ActionExecutionResult errorResult = new ActionExecutionResult();
                errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                errorResult.setIsExecutionSuccess(false);
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Missing required " +
                        "parameter: Query."));
                errorResult.setTitle(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle());
                ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
                actionExecutionRequest.setProperties(requestData);
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            actionConfiguration.setBody(query.trim());

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
            return executeCommon(connection, actionConfiguration, FALSE, null, null, requestData);
        }
        
        @Override
        public Mono<ActionExecutionResult> execute(Connection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }
        
        public Mono<ActionExecutionResult> executeCommon(Connection connection,
        		ActionConfiguration actionConfiguration,
        		Boolean preparedStatement,
        		List<String> mustacheValuesInOrder,
        		ExecuteActionDTO executeActionDTO,
        		Map<String, Object> requestData) {

        	String query = actionConfiguration.getBody();

        	boolean isSelectOrShowQuery = getIsSelectOrShowQuery(query);

        	final List<Map<String, Object>> rowsList = new ArrayList<>(50);
        	final List<String> columnsList = new ArrayList<>();
        	Map<String, Object> psParams = preparedStatement ? new LinkedHashMap<>() : null;
        	String transformedQuery = preparedStatement ? replaceQuestionMarkWithDollarIndex(query) : query;
        	List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
        			transformedQuery, null, null, psParams));

        	// TODO: need to write a JUnit TC for VALIDATION_CHECK_TIMEOUT
        	Flux<Result> resultFlux = Mono.from(connection.validate(ValidationDepth.REMOTE))
        			.timeout(Duration.ofSeconds(VALIDATION_CHECK_TIMEOUT))
        			.onErrorMap(TimeoutException.class, error -> new StaleConnectionException())
        			.flatMapMany(isValid -> {
        				if (isValid) {
        					return createAndExecuteQueryFromConnection(query,
        							connection,
        							preparedStatement,
        							mustacheValuesInOrder,
        							executeActionDTO,
        							requestData,
        							psParams);
        				}
        				return Flux.error(new StaleConnectionException());
        			});

        	Mono<List<Map<String, Object>>> resultMono;

        	if (isSelectOrShowQuery) {
        		resultMono = resultFlux
        				.flatMap(result ->
        				result.map((row, meta) -> {
        					rowsList.add(getRow(row, meta));

        					if (columnsList.isEmpty()) {
        						columnsList.addAll(meta.getColumnNames());
        					}

        					return result;
        				}
        						)
        						)
        				.collectList()
        				.thenReturn(rowsList);
        	} else {
        		resultMono = resultFlux
        				.flatMap(Result::getRowsUpdated)
        				.collectList()
        				.flatMap(list -> Mono.just(list.get(list.size() - 1)))
        				.map(rowsUpdated -> {
        					rowsList.add(
        							Map.of(
        									"affectedRows",
        									ObjectUtils.defaultIfNull(rowsUpdated, 0)
        									)
        							);
        					return rowsList;
        				});
        	}

        	return resultMono
        			.map(res -> {
        				ActionExecutionResult result = new ActionExecutionResult();
        				result.setBody(objectMapper.valueToTree(rowsList));
        				result.setMessages(populateHintMessages(columnsList));
        				result.setIsExecutionSuccess(true);
        				System.out.println(Thread.currentThread().getName() + " In the OraclePlugin, got action " +
        						"execution result");
        				return result;
        			})
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
        			.subscribeOn(scheduler);
        }        
        
        private Flux<Result> createAndExecuteQueryFromConnection(String query,
        		Connection connection,
        		Boolean preparedStatement,
        		List<String> mustacheValuesInOrder,
        		ExecuteActionDTO executeActionDTO,
        		Map<String, Object> requestData,
        		Map psParams) {

        	Statement connectionStatement = connection.createStatement(query);
        	if (FALSE.equals(preparedStatement) || mustacheValuesInOrder == null || mustacheValuesInOrder.isEmpty()) {
        		return Flux.from(connectionStatement.execute());
        	}

        	System.out.println("Query : " + query);

        	List<Map.Entry<String, String>> parameters = new ArrayList<>();
        	try {
        		connectionStatement = (Statement) this.smartSubstitutionOfBindings(connectionStatement,
        				mustacheValuesInOrder,
        				executeActionDTO.getParams(),
        				parameters);

        		requestData.put("ps-parameters", parameters);

        		IntStream.range(0, parameters.size())
        		.forEachOrdered(i ->
        		psParams.put(
        				getPSParamLabel(i + 1),
        				new PsParameterDTO(parameters.get(i).getKey(), parameters.get(i).getValue())));

        	} catch (AppsmithPluginException e) {
        		return Flux.error(e);
        	}


        	return Flux.from(connectionStatement.execute());

        }
        
        private boolean getIsSelectOrShowQuery(String query) {
            String[] queries = query.split(";");

            String lastQuery = queries[queries.length - 1].trim();

            return (lastQuery.trim().split("\\s+")[0].equalsIgnoreCase("select")
                    || lastQuery.trim().split("\\s+")[0].equalsIgnoreCase("show"));
        }
        
        private Set<String> populateHintMessages(List<String> columnNames) {

            Set<String> messages = new HashSet<>();

            List<String> identicalColumns = getIdenticalColumns(columnNames);
            if (!CollectionUtils.isEmpty(identicalColumns)) {
                messages.add("Your Oracle query result may not have all the columns because duplicate column names " +
                        "were found for the column(s): " + String.join(", ", identicalColumns) + ". You may use the " +
                        "SQL keyword 'as' to rename the duplicate column name(s) and resolve this issue.");
            }

            return messages;
        }
        
        /**
         * 1. Parse the actual row objects returned by r2dbc driver for oracle statements.
         * 2. Return the row as a map {column_name -> column_value}.
         */
        private Map<String, Object> getRow(Row row, RowMetadata meta) {
            Iterator<ColumnMetadata> iterator = (Iterator<ColumnMetadata>) meta.getColumnMetadatas().iterator();
            Map<String, Object> processedRow = new LinkedHashMap<>();

            while (iterator.hasNext()) {
                ColumnMetadata metaData = iterator.next();
                String columnName = metaData.getName();
                String typeName = metaData.getJavaType().toString();
                Object columnValue = row.get(columnName);

                if (java.time.LocalDate.class.toString().equalsIgnoreCase(typeName) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE.format(row.get(columnName, LocalDate.class));
                } else if ((java.time.LocalDateTime.class.toString().equalsIgnoreCase(typeName)) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE_TIME.format(
                            LocalDateTime.of(
                                    row.get(columnName, LocalDateTime.class).toLocalDate(),
                                    row.get(columnName, LocalDateTime.class).toLocalTime()
                            )
                    ) + "Z";
                } else if (java.time.LocalTime.class.toString().equalsIgnoreCase(typeName) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_TIME.format(row.get(columnName,
                            LocalTime.class));
                } else if (java.time.Year.class.toString().equalsIgnoreCase(typeName) && columnValue != null) {
                    columnValue = row.get(columnName, LocalDate.class).getYear();
                } else {
                    columnValue = row.get(columnName);
                }

                processedRow.put(columnName, columnValue);
            }

            return processedRow;
        }
        
        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

            StringBuilder urlBuilder = new StringBuilder();
            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                urlBuilder.append(datasourceConfiguration.getUrl());
            } else {
                urlBuilder.append("r2dbc:oracle://");
                final List<String> hosts = new ArrayList<>();

                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    hosts.add(endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 1521L));
                }

                urlBuilder.append(String.join(",", hosts)).append("/");

                if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                    urlBuilder.append(authentication.getDatabaseName());
                }

            }

            ConnectionFactoryOptions baseOptions = ConnectionFactoryOptions.parse(urlBuilder.toString());
            ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions)
                    .option(ConnectionFactoryOptions.USER, authentication.getUsername())
                    .option(ConnectionFactoryOptions.PASSWORD, authentication.getPassword());

            /*
             * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
             */
            if (datasourceConfiguration.getConnection() == null
                    || datasourceConfiguration.getConnection().getSsl() == null
                    || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Appsmith server has failed to fetch SSL configuration from datasource configuration form. " +
                                        "Please reach out to Appsmith customer support to resolve this."
                        )
                );
            }

            /*
             * - By default, the driver configures SSL in the preferred mode.
             */
            SSLDetails.AuthType sslAuthType = datasourceConfiguration.getConnection().getSsl().getAuthType();
            switch (sslAuthType) {
                case PREFERRED:
                case REQUIRED:
                    ob = ob
                            .option(SSL, true)
                            .option(Option.valueOf("sslMode"), sslAuthType.toString().toLowerCase());

                    break;
                case DISABLED:
                    ob = ob.option(SSL, false);

                    break;
                case DEFAULT:
                    /* do nothing - accept default driver setting*/

                    break;
                default:
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Appsmith server has found an unexpected SSL option: " + sslAuthType + ". Please reach out to" +
                                            " Appsmith customer support to resolve this."
                            )
                    );
            }

            return (Mono<Connection>) Mono.from(ConnectionFactories.get(ob.build()).create())
                    .onErrorResume(exception -> Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            exception
                    )))
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
                    if (endpoint.getHost() == null || endpoint.getHost().isBlank()) {
                        invalids.add("Host value cannot be empty");
                    } else if (endpoint.getHost().contains("/") || endpoint.getHost().contains(":")) {
                        invalids.add("Host value cannot contain `/` or `:` characters. Found `" + endpoint.getHost() + "`.");
                    }
                }
            }

            if (datasourceConfiguration.getAuthentication() == null) {
                invalids.add("Missing authentication details.");
            } else {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add("Missing username for authentication.");
                }

                if (StringUtils.isEmpty(authentication.getPassword()) && StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add("Missing password for authentication.");
                } else if (StringUtils.isEmpty(authentication.getPassword())) {
                    // it is valid if it has the username but not the password
                    authentication.setPassword("");
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
                    .flatMap(connection -> Mono.from(connection.close()))
                    .then(Mono.just(new DatasourceTestResult()))
                    .onErrorResume(error -> {
                        // We always expect to have an error object, but the error object may not be well formed
                        final String errorMessage = error.getMessage() == null
                                ? AppsmithPluginError.PLUGIN_DATASOURCE_TEST_GENERIC_ERROR.getMessage()
                                : error.getMessage();
                        System.out.println("Error when testing Oracle datasource. " + errorMessage);
                        return Mono.just(new DatasourceTestResult(errorMessage));
                    })
                    .subscribeOn(scheduler);

        }
    }
}