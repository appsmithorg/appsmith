package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.helpers.RequestCaptureFilter;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ApiContentType;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.BaseRestApiPluginExecutor;
import com.appsmith.external.services.SharedConfig;
import com.external.utils.GraphQLHintMessageUtils;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromPropertyList;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInPropertyList;
import static com.external.utils.GraphQLBodyUtils.PAGINATION_DATA_INDEX;
import static com.external.utils.GraphQLBodyUtils.QUERY_VARIABLES_INDEX;
import static com.external.utils.GraphQLBodyUtils.convertToGraphQLPOSTBodyFormat;
import static com.external.utils.GraphQLBodyUtils.getGraphQLQueryParamsForBodyAndVariables;
import static com.external.utils.GraphQLBodyUtils.validateBodyAndVariablesSyntax;
import static com.external.utils.GraphQLDataTypeUtils.smartlyReplaceGraphQLQueryBodyPlaceholderWithValue;
import static com.external.utils.GraphQLPaginationUtils.updateVariablesWithPaginationValues;
import static java.lang.Boolean.TRUE;
import static org.apache.commons.lang3.StringUtils.isBlank;

public class GraphQLPlugin extends BasePlugin {

    public GraphQLPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class GraphQLPluginExecutor extends BaseRestApiPluginExecutor {

        public GraphQLPluginExecutor(SharedConfig sharedConfig) {
            super(sharedConfig);

            GraphQLHintMessageUtils hintMessageUtils = new GraphQLHintMessageUtils();
            super.setHintMessageUtils(hintMessageUtils);
        }

        /**
         * Instead of using the default executeParametrized provided by pluginExecutor, this implementation affords an opportunity
         * also update the datasource and action configuration for pagination and some minor cleanup of the configuration before execution
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
        public Mono<ActionExecutionResult> executeParameterized(APIConnection connection,
                                                                ExecuteActionDTO executeActionDTO,
                                                                DatasourceConfiguration datasourceConfiguration,
                                                                ActionConfiguration actionConfiguration) {

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            String variables = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
            Boolean smartSubstitution = this.smartSubstitutionUtils.isSmartSubstitutionEnabled(properties);
            if (TRUE.equals(smartSubstitution)) {
                /* Apply smart JSON substitution logic to mustache binding values in query variables */
                if (!isBlank(variables)) {
                    List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(variables);
                    // Replace all the bindings with a ? as expected in a prepared statement.
                    String updatedVariables = MustacheHelper.replaceMustacheWithPlaceholder(variables, mustacheKeysInOrder);

                    try {
                        updatedVariables = (String) smartSubstitutionOfBindings(updatedVariables,
                                mustacheKeysInOrder,
                                executeActionDTO.getParams(),
                                parameters,
                                false);
                        setValueSafelyInPropertyList(properties, QUERY_VARIABLES_INDEX, updatedVariables);
                    } catch (AppsmithPluginException e) {
                        ActionExecutionResult errorResult = new ActionExecutionResult();
                        errorResult.setIsExecutionSuccess(false);
                        errorResult.setErrorInfo(e);
                        errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                        return Mono.just(errorResult);
                    }
                }

                /* Apply smart substitution logic to query body */
                String query = actionConfiguration.getBody();
                if (!isBlank(query)) {
                    List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
                    // Replace all the bindings with a ? as expected in a prepared statement.
                    String updatedQuery = MustacheHelper.replaceMustacheWithPlaceholder(query, mustacheKeysInOrder);

                    try {
                        updatedQuery = (String) smartSubstitutionOfBindings(updatedQuery,
                                mustacheKeysInOrder,
                                executeActionDTO.getParams(),
                                parameters,
                                true);
                        actionConfiguration.setBody(updatedQuery);
                    } catch (AppsmithPluginException e) {
                        ActionExecutionResult errorResult = new ActionExecutionResult();
                        errorResult.setIsExecutionSuccess(false);
                        errorResult.setErrorInfo(e);
                        errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                        return Mono.just(errorResult);
                    }
                }
            }

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            if (isBlank(variables)) {
                setValueSafelyInPropertyList(properties, QUERY_VARIABLES_INDEX, "{}");
            }

            /* Check if the query body and query variables have the correct GraphQL syntax. */
            try {
                validateBodyAndVariablesSyntax(actionConfiguration);
            } catch (AppsmithPluginException e) {
                return Mono.error(e);
            }

            if (actionConfiguration.getPaginationType() != null && !PaginationType.NONE.equals(actionConfiguration.getPaginationType())) {
                updateVariablesWithPaginationValues(actionConfiguration, executeActionDTO);
            }

            // Filter out any empty headers
            headerUtils.removeEmptyHeaders(actionConfiguration);

            return this.executeCommon(connection, datasourceConfiguration, actionConfiguration, parameters);
        }

        public Mono<ActionExecutionResult> executeCommon(APIConnection apiConnection,
                                                         DatasourceConfiguration datasourceConfiguration,
                                                         ActionConfiguration actionConfiguration,
                                                         List<Map.Entry<String, String>> insertedParams) {

            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();
            initUtils.initializeResponseWithError(errorResult);

            // Initializing request URL
            String url = initUtils.initializeRequestUrl(actionConfiguration, datasourceConfiguration);

            Boolean encodeParamsToggle = headerUtils.isEncodeParamsToggleEnabled(actionConfiguration);

            URI uri;
            try {
                uri = uriUtils.createUriWithQueryParams(actionConfiguration, datasourceConfiguration, url,
                        encodeParamsToggle);
            } catch (URISyntaxException e) {
                ActionExecutionRequest actionExecutionRequest =
                        RequestCaptureFilter.populateRequestFields(actionConfiguration, null, insertedParams, objectMapper);
                actionExecutionRequest.setUrl(url);
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage(e));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            ActionExecutionRequest actionExecutionRequest =
                    RequestCaptureFilter.populateRequestFields(actionConfiguration, uri, insertedParams, objectMapper);

            WebClient.Builder webClientBuilder = triggerUtils.getWebClientBuilder(actionConfiguration,
                    datasourceConfiguration);

            String reqContentType = headerUtils.getRequestContentType(actionConfiguration, datasourceConfiguration);

            /* Check for content type */
            final String contentTypeError = headerUtils.verifyContentType(actionConfiguration.getHeaders());
            if (contentTypeError != null) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Invalid value for Content-Type."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            if (httpMethod == null) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("HTTPMethod must be set."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            if (HttpMethod.POST.equals(httpMethod)) {
                /**
                 * For content-type=application/json re-formatting is required.
                 * Ref: https://graphql.org/learn/serving-over-http/#post-request
                 *
                 * Graphql reference doc also mentions that content-type=application/graphql does not require any
                 * re-formatting.
                 * Ref: https://graphql.org/learn/serving-over-http/#post-request
                 *
                 * On searching over the web I also found that there are some custom content-type in use like
                 * `application/graphql+json` or `application/graphql-json` that expect the data in the same format
                 * as is for `application/json`. Hence, the current check assumes that any content type that differs
                 * from `application/graphql` would expect the data in the same format as for `application/json`
                 */
                if (!ApiContentType.GRAPHQL.getValue().equals(reqContentType)) {
                    /**
                     * When a GraphQL request is sent using HTTP POST method, then the request body needs to be in the
                     * following format:
                     * {
                     *     "query": "... graphql query body ...",
                     *     "variables": {"var1": val1, "var2": val2 ...},
                     *     "operationName": "name of operation" // only required if multiple operations are defined in a
                     *     single query body
                     * }
                     * Ref: https://graphql.org/learn/serving-over-http/
                     */
                    try {
                        actionConfiguration.setBody(convertToGraphQLPOSTBodyFormat(actionConfiguration));
                    } catch (AppsmithPluginException e) {
                        return Mono.error(e);
                    }
                }
            }
            else if (HttpMethod.GET.equals(httpMethod)) {
                /**
                 * When a GraphQL request is sent using GET method, the GraphQL body and variables are sent as part of
                 * query parameters in the URL.
                 * Ref: https://graphql.org/learn/serving-over-http/
                 */
                List<Property> additionalQueryParams = getGraphQLQueryParamsForBodyAndVariables(actionConfiguration);
                uri = uriUtils.addQueryParamsToURI(uri, additionalQueryParams, encodeParamsToggle);
            }
            else {
                /**
                 * Only POST and GET HTTP methods are supported by GraphQL specifications.
                 * Ref: https://graphql.org/learn/serving-over-http/
                 */
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Appsmith server has found an unexpected HTTP method configured with the GraphQL " +
                                        "plugin query: " + httpMethod
                        )
                );
            }

            final RequestCaptureFilter requestCaptureFilter = new RequestCaptureFilter(objectMapper);
            Object requestBodyObj = dataUtils.getRequestBodyObject(actionConfiguration, reqContentType,
                    encodeParamsToggle,
                    httpMethod);
            WebClient client = triggerUtils.getWebClient(webClientBuilder, apiConnection, reqContentType, objectMapper,
                    EXCHANGE_STRATEGIES, requestCaptureFilter);

            /* Triggering the actual REST API call */
            Set<String> hintMessages = new HashSet<>();
            return triggerUtils.triggerApiCall(client, httpMethod, uri, requestBodyObj, actionExecutionRequest,
                    objectMapper,
                    hintMessages, errorResult, requestCaptureFilter);
        }

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) {
            boolean isInputQueryBody = (boolean) args[0];
            Param param = (Param) args[1];
            if (!isInputQueryBody) {
                String queryVariables = (String) input;
                return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(queryVariables, value, null, insertedParams, null, param);
            }
            else {
                String queryBody = (String) input;
                return smartlyReplaceGraphQLQueryBodyPlaceholderWithValue(queryBody, value, insertedParams);
            }
        }

        /**
         * This method returns a set of paths that are expected to contain bindings that refer to the
         * same action object i.e. a cyclic reference. e.g. A GraphQL API response can contain pagination
         * cursors that are required to be configured in the pagination tab of the same API. We don't want to treat
         * these cyclic references as cyclic dependency errors.
         */
        @Override
        public Set<String> getSelfReferencingDataPaths() {
            return Set.of("pluginSpecifiedTemplates[" + PAGINATION_DATA_INDEX + "].value.limitBased.limit.value",
                    "pluginSpecifiedTemplates[" + PAGINATION_DATA_INDEX + "].value.limitBased.offset.value",
                    "pluginSpecifiedTemplates[" + PAGINATION_DATA_INDEX + "].value.cursorBased.next.limit.value",
                    "pluginSpecifiedTemplates[" + PAGINATION_DATA_INDEX + "].value.cursorBased.next.cursor.value",
                    "pluginSpecifiedTemplates[" + PAGINATION_DATA_INDEX + "].value.cursorBased.previous.limit.value",
                    "pluginSpecifiedTemplates[" + PAGINATION_DATA_INDEX + "].value.cursorBased.previous.cursor.value");
        }
    }
}
