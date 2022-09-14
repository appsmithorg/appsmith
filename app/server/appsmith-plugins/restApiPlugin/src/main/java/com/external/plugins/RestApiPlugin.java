package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.BaseRestApiPluginExecutor;
import com.appsmith.external.services.SharedConfig;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.helpers.RequestCaptureFilter;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static java.lang.Boolean.TRUE;

@Slf4j
public class RestApiPlugin extends BasePlugin {

    public RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class RestApiPluginExecutor extends BaseRestApiPluginExecutor {

        public RestApiPluginExecutor(SharedConfig sharedConfig) {
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

            // Smartly substitute in actionConfiguration.body and replace all the bindings with values.
            Boolean smartJsonSubstitution = this.smartSubstitutionUtils.isSmartSubstitutionEnabled(properties);
            if (TRUE.equals(smartJsonSubstitution)) {
                // Do smart replacements in JSON body
                if (actionConfiguration.getBody() != null) {

                    // First extract all the bindings in order
                    List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(actionConfiguration.getBody());
                    // Replace all the bindings with a ? as expected in a prepared statement.
                    String updatedBody = MustacheHelper.replaceMustacheWithPlaceholder(actionConfiguration.getBody(), mustacheKeysInOrder);

                    try {
                        updatedBody = (String) smartSubstitutionOfBindings(updatedBody,
                                mustacheKeysInOrder,
                                executeActionDTO.getParams(),
                                parameters);
                    } catch (AppsmithPluginException e) {
                        ActionExecutionResult errorResult = new ActionExecutionResult();
                        errorResult.setIsExecutionSuccess(false);
                        errorResult.setErrorInfo(e);
                        errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                        return Mono.just(errorResult);
                    }

                    actionConfiguration.setBody(updatedBody);
                }
            }

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            // If the action is paginated, update the configurations to update the correct URL.
            if (actionConfiguration.getPaginationType() != null &&
                    PaginationType.URL.equals(actionConfiguration.getPaginationType()) &&
                    executeActionDTO.getPaginationField() != null) {
                updateDatasourceConfigurationForPagination(actionConfiguration, datasourceConfiguration, executeActionDTO.getPaginationField());
                updateActionConfigurationForPagination(actionConfiguration, executeActionDTO.getPaginationField());
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

            final RequestCaptureFilter requestCaptureFilter = new RequestCaptureFilter(objectMapper);
            Object requestBodyObj = dataUtils.getRequestBodyObject(actionConfiguration, reqContentType,
                    encodeParamsToggle,
                    httpMethod);
            WebClient client = triggerUtils.getWebClient(webClientBuilder, apiConnection, reqContentType, objectMapper,
                    EXCHANGE_STRATEGIES, requestCaptureFilter);

            /* Triggering the actual REST API call */
            return triggerUtils.triggerApiCall(client, httpMethod, uri, requestBodyObj, actionExecutionRequest,
                    objectMapper, hintMessages, errorResult, requestCaptureFilter);
        }

        private ActionConfiguration updateActionConfigurationForPagination(ActionConfiguration actionConfiguration,
                                                                           PaginationField paginationField) {
            if (PaginationField.NEXT.equals(paginationField) || PaginationField.PREV.equals(paginationField)) {
                actionConfiguration.setPath("");
                actionConfiguration.setQueryParameters(null);
            }
            return actionConfiguration;
        }

        private DatasourceConfiguration updateDatasourceConfigurationForPagination(ActionConfiguration actionConfiguration,
                                                                                   DatasourceConfiguration datasourceConfiguration,
                                                                                   PaginationField paginationField) {
            if (PaginationField.NEXT.equals(paginationField)) {
                if (actionConfiguration.getNext() == null) {
                    datasourceConfiguration.setUrl(null);
                } else {
                    datasourceConfiguration.setUrl(URLDecoder.decode(actionConfiguration.getNext(), StandardCharsets.UTF_8));
                }
            } else if (PaginationField.PREV.equals(paginationField)) {
                datasourceConfiguration.setUrl(actionConfiguration.getPrev());
            }
            return datasourceConfiguration;
        }

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) {
            String jsonBody = (String) input;
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(jsonBody, value, null, insertedParams, null);
        }
    }
}
