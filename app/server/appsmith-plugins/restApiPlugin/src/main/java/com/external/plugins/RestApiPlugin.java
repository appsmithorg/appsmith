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
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.BaseRestApiPluginExecutor;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.exceptions.RestApiErrorMessages;
import com.external.plugins.exceptions.RestApiPluginError;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URLDecoder;
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
        public Mono<ActionExecutionResult> executeParameterized(
                APIConnection connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            // for alloy poc
            if ((datasourceConfiguration.getProperties().size() > 2)
                    && (datasourceConfiguration.getProperties().get(2).getKey().equals("credentialId"))) {
                Property bearerTokenHeader = new Property();
                bearerTokenHeader.setKey("Authorization");
                bearerTokenHeader.setValue("Bearer lx88xhxteDfsTa4POjXCw");
                List<Property> headers = datasourceConfiguration.getHeaders() == null
                        ? new ArrayList<>()
                        : datasourceConfiguration.getHeaders();
                headers.add(bearerTokenHeader);
                datasourceConfiguration.setHeaders(headers);
            }
            log.debug(Thread.currentThread().getName()
                    + ": executeParameterized() called for RestAPI plugin. Executing the API call.");
            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            // Smartly substitute in actionConfiguration.body and replace all the bindings with values.
            Boolean smartJsonSubstitution = this.smartSubstitutionUtils.isSmartSubstitutionEnabled(properties);
            if (TRUE.equals(smartJsonSubstitution)) {
                // Do smart replacements in JSON body
                if (actionConfiguration.getBody() != null) {

                    // First extract all the bindings in order
                    List<MustacheBindingToken> mustacheKeysInOrder =
                            MustacheHelper.extractMustacheKeysInOrder(actionConfiguration.getBody());
                    // Replace all the bindings with a ? as expected in a prepared statement.
                    String updatedBody = MustacheHelper.replaceMustacheWithPlaceholder(
                            actionConfiguration.getBody(), mustacheKeysInOrder);

                    try {
                        updatedBody = (String) smartSubstitutionOfBindings(
                                updatedBody, mustacheKeysInOrder, executeActionDTO.getParams(), parameters);
                    } catch (AppsmithPluginException e) {
                        ActionExecutionResult errorResult = new ActionExecutionResult();
                        errorResult.setIsExecutionSuccess(false);
                        errorResult.setErrorInfo(e);
                        return Mono.just(errorResult);
                    }

                    actionConfiguration.setBody(updatedBody);
                }
            }

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            // If the action is paginated, update the configurations to update the correct URL.
            if (actionConfiguration.getPaginationType() != null
                    && PaginationType.URL.equals(actionConfiguration.getPaginationType())
                    && executeActionDTO.getPaginationField() != null) {
                List<Property> paginationQueryParamsList = new ArrayList<>();
                updateDatasourceConfigurationForPagination(
                        actionConfiguration,
                        datasourceConfiguration,
                        paginationQueryParamsList,
                        executeActionDTO.getPaginationField());
                updateActionConfigurationForPagination(
                        actionConfiguration, paginationQueryParamsList, executeActionDTO.getPaginationField());
            }

            // Filter out any empty headers
            headerUtils.removeEmptyHeaders(actionConfiguration);
            headerUtils.setHeaderFromAutoGeneratedHeaders(actionConfiguration);

            return this.executeCommon(connection, datasourceConfiguration, actionConfiguration, parameters);
        }

        public Mono<ActionExecutionResult> executeCommon(
                APIConnection apiConnection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration,
                List<Map.Entry<String, String>> insertedParams) {

            log.debug(Thread.currentThread().getName()
                    + ": executeCommon() called for RestAPI plugin. Executing the API call.");
            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();
            initUtils.initializeResponseWithError(errorResult);

            // Set of hint messages that can be returned to the user.
            Set<String> hintMessages = new HashSet<>();

            // Initializing request URL
            String url = initUtils.initializeRequestUrl(actionConfiguration, datasourceConfiguration);

            Boolean encodeParamsToggle = headerUtils.isEncodeParamsToggleEnabled(actionConfiguration);

            URI uri;
            try {
                uri = uriUtils.createUriWithQueryParams(
                        actionConfiguration, datasourceConfiguration, url, encodeParamsToggle);
            } catch (Exception e) {
                ActionExecutionRequest actionExecutionRequest = RequestCaptureFilter.populateRequestFields(
                        actionConfiguration, null, insertedParams, objectMapper);
                actionExecutionRequest.setUrl(url);
                errorResult.setErrorInfo(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        RestApiErrorMessages.URI_SYNTAX_WRONG_ERROR_MSG,
                        e.getMessage()));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            ActionExecutionRequest actionExecutionRequest =
                    RequestCaptureFilter.populateRequestFields(actionConfiguration, uri, insertedParams, objectMapper);

            WebClient.Builder webClientBuilder =
                    restAPIActivateUtils.getWebClientBuilder(actionConfiguration, datasourceConfiguration);
            String reqContentType = headerUtils.getRequestContentType(actionConfiguration, datasourceConfiguration);

            /* Check for content type */
            final String contentTypeError = headerUtils.verifyContentType(actionConfiguration.getHeaders());
            if (contentTypeError != null) {
                errorResult.setErrorInfo(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        RestApiErrorMessages.INVALID_CONTENT_TYPE_ERROR_MSG));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            if (httpMethod == null) {
                errorResult.setErrorInfo(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        RestApiErrorMessages.NO_HTTP_METHOD_ERROR_MSG));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            final RequestCaptureFilter requestCaptureFilter = new RequestCaptureFilter(objectMapper);
            Object requestBodyObj =
                    dataUtils.getRequestBodyObject(actionConfiguration, reqContentType, encodeParamsToggle, httpMethod);
            WebClient client = restAPIActivateUtils.getWebClient(
                    webClientBuilder, apiConnection, reqContentType, EXCHANGE_STRATEGIES, requestCaptureFilter);

            /* Triggering the actual REST API call */
            return restAPIActivateUtils
                    .triggerApiCall(
                            client,
                            httpMethod,
                            uri,
                            requestBodyObj,
                            actionExecutionRequest,
                            objectMapper,
                            hintMessages,
                            errorResult,
                            requestCaptureFilter,
                            datasourceConfiguration)
                    .onErrorResume(error -> {
                        boolean isBodySentWithApiRequest = requestBodyObj == null ? false : true;
                        errorResult.setRequest(requestCaptureFilter.populateRequestFields(
                                actionExecutionRequest, isBodySentWithApiRequest, datasourceConfiguration));
                        errorResult.setIsExecutionSuccess(false);
                        log.debug(String.format(
                                "An error has occurred while trying to run the API query for url: %s, path: %s",
                                datasourceConfiguration.getUrl(), actionConfiguration.getPath()));
                        error.printStackTrace();
                        if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    RestApiPluginError.API_EXECUTION_FAILED,
                                    RestApiErrorMessages.API_EXECUTION_FAILED_ERROR_MSG,
                                    error);
                        }
                        errorResult.setErrorInfo(error);
                        return Mono.just(errorResult);
                    });
        }

        private ActionConfiguration updateActionConfigurationForPagination(
                ActionConfiguration actionConfiguration,
                List<Property> queryParamsList,
                PaginationField paginationField) {
            if (PaginationField.NEXT.equals(paginationField) || PaginationField.PREV.equals(paginationField)) {
                actionConfiguration.setPath("");
                actionConfiguration.setQueryParameters(queryParamsList);
            }
            return actionConfiguration;
        }

        private DatasourceConfiguration updateDatasourceConfigurationForPagination(
                ActionConfiguration actionConfiguration,
                DatasourceConfiguration datasourceConfiguration,
                List<Property> paginationQueryParamsList,
                PaginationField paginationField) {

            if (PaginationField.NEXT.equals(paginationField)) {
                if (actionConfiguration.getNext() == null) {
                    datasourceConfiguration.setUrl(null);
                } else {
                    paginationQueryParamsList.addAll(
                            decodeUrlAndGetAllQueryParams(datasourceConfiguration, actionConfiguration.getNext()));
                }
            } else if (PaginationField.PREV.equals(paginationField)) {
                paginationQueryParamsList.addAll(
                        decodeUrlAndGetAllQueryParams(datasourceConfiguration, actionConfiguration.getPrev()));
            }

            return datasourceConfiguration;
        }

        private List<Property> decodeUrlAndGetAllQueryParams(
                DatasourceConfiguration datasourceConfiguration, String inputUrl) {

            String decodedUrl = URLDecoder.decode(inputUrl, StandardCharsets.UTF_8);

            String[] urlParts = decodedUrl.split("\\?");
            datasourceConfiguration.setUrl(urlParts[0]);

            if (urlParts.length >= 2) {

                StringBuilder queryParamBuilder = new StringBuilder();

                for (int i = 1; i < urlParts.length; i++) {

                    if (queryParamBuilder.length() != 0) {
                        queryParamBuilder.append("?");
                    }

                    queryParamBuilder.append(urlParts[i]);
                }

                return getQueryParamListFromUrlSuffix(queryParamBuilder.toString());
            }

            return new ArrayList<>();
        }

        private List<Property> getQueryParamListFromUrlSuffix(String queryParams) {

            String[] queryParamArray = queryParams.split("&");

            List<Property> queryParamList = new ArrayList<>();

            for (String queryParam : queryParamArray) {
                String[] keyValue = queryParam.split("=");

                String key = keyValue.length > 0 ? keyValue[0] : "";
                String value = keyValue.length > 1 ? keyValue[1] : "";

                if (key.isEmpty()) {
                    continue;
                }

                Property property = new Property(key, value);
                queryParamList.add(property);
            }

            return queryParamList;
        }

        @Override
        public Object substituteValueInInput(
                int index,
                String binding,
                String value,
                Object input,
                List<Map.Entry<String, String>> insertedParams,
                Object... args) {
            String jsonBody = (String) input;
            Param param = (Param) args[0];
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(
                    jsonBody, value, null, insertedParams, null, param);
        }
    }
}
