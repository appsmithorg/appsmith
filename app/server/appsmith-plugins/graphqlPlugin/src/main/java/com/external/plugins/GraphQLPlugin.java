package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.helpers.RequestCaptureFilter;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.BaseRestApiPluginExecutor;
import com.appsmith.external.services.SharedConfig;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.external.utils.BodyUtils.convertToGraphQLPOSTBodyFormat;
import static com.external.utils.BodyUtils.getGraphQLQueryParamsForBodyAndVariables;
import static com.external.utils.BodyUtils.validateBodyAndVariablesSyntax;

public class GraphQLPlugin extends BasePlugin {

    public GraphQLPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class GraphQLPluginExecutor extends BaseRestApiPluginExecutor {

        public GraphQLPluginExecutor(SharedConfig sharedConfig) {
            super(sharedConfig);
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

            //TODO: remove after test
            String testBody = "query Launches($limit: Int) {\n" +
                    "  capsules(limit: $limit) {\n" +
                    "    dragon {\n" +
                    "      dry_mass_kg\n" +
                    "    }\n" +
                    "  }\n" +
                    "}\n";
            actionConfiguration.setBody(testBody);

            String variables = "{\n" +
                    "  \"limit\": 2\n" +
                    "}";
            properties.add(new Property("variables", variables));

            // TODO: handle smart substitution for query body and query variables
            // TODO: handle cursor pagination

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            /* Check if the query body and query variables have the correct GraphQL syntax. */
            try {
                validateBodyAndVariablesSyntax(actionConfiguration);
            } catch (AppsmithPluginException e) {
                return Mono.error(e);
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

            // Set of hint messages that can be returned to the user.
            Set<String> hintMessages = new HashSet();

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

            try {
                if (uriUtils.isHostDisallowed(uri)) {
                    errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Host not allowed."));
                    errorResult.setRequest(actionExecutionRequest);
                    return Mono.just(errorResult);
                }
            } catch (UnknownHostException e) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Unknown host."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

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
            return triggerUtils.triggerApiCall(client, httpMethod, uri, requestBodyObj, actionExecutionRequest,
                    objectMapper,
                    hintMessages, errorResult, requestCaptureFilter);
        }
    }
}
