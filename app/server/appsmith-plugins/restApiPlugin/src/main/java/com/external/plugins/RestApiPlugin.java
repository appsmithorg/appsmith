package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.helpers.restApiUtils.helpers.SmartSubstitutionUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ApiContentType;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.external.services.SharedConfig;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnectionFactory;
import com.appsmith.external.helpers.restApiUtils.helpers.DataUtils;
import com.appsmith.external.helpers.restApiUtils.helpers.DatasourceValidator;
import com.appsmith.external.helpers.restApiUtils.helpers.RequestCaptureFilter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

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

import static com.appsmith.external.helpers.restApiUtils.helpers.HeaderUtils.getSignatureKey;
import static com.appsmith.external.helpers.restApiUtils.helpers.HeaderUtils.isEncodeParamsToggleEnabled;
import static com.appsmith.external.helpers.restApiUtils.helpers.HeaderUtils.removeEmptyHeaders;
import static com.appsmith.external.helpers.restApiUtils.helpers.HeaderUtils.verifyContentType;
import static com.appsmith.external.helpers.restApiUtils.helpers.HintMessageUtils.getActionHintMessages;
import static com.appsmith.external.helpers.restApiUtils.helpers.HintMessageUtils.getDatasourceHintMessages;
import static com.appsmith.external.helpers.restApiUtils.helpers.InitUtils.initializeRequestUrl;
import static com.appsmith.external.helpers.restApiUtils.helpers.InitUtils.initializeResponseWithError;
import static com.appsmith.external.helpers.restApiUtils.helpers.TriggerUtils.getWebClient;
import static com.appsmith.external.helpers.restApiUtils.helpers.TriggerUtils.getWebClientBuilder;
import static com.appsmith.external.helpers.restApiUtils.helpers.TriggerUtils.triggerApiCall;
import static com.appsmith.external.helpers.restApiUtils.helpers.URIUtils.createFinalUriWithQueryParams;
import static com.appsmith.external.helpers.restApiUtils.helpers.URIUtils.isHostDisallowed;
import static java.lang.Boolean.TRUE;

public class RestApiPlugin extends BasePlugin {

    public RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor<APIConnection>, SmartSubstitutionInterface {

        private final String FIELD_API_CONTENT_TYPE = "apiContentType";

        private final SharedConfig sharedConfig;
        private final DataUtils dataUtils;

        // Setting max content length. This would've been coming from `spring.codec.max-in-memory-size` property if the
        // `WebClient` instance was loaded as an auto-wired bean.
        public ExchangeStrategies EXCHANGE_STRATEGIES;

        public RestApiPluginExecutor(SharedConfig sharedConfig) {
            this.sharedConfig = sharedConfig;
            this.dataUtils = DataUtils.getInstance();
            this.EXCHANGE_STRATEGIES = ExchangeStrategies
                    .builder()
                    .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(sharedConfig.getCodecSize()))
                    .build();
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
            Boolean smartJsonSubstitution = SmartSubstitutionUtils.isJsonSmartSubstitutionEnabled(properties);
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
            removeEmptyHeaders(actionConfiguration);

            return this.executeCommon(connection, datasourceConfiguration, actionConfiguration, parameters);
        }

        public Mono<ActionExecutionResult> executeCommon(APIConnection apiConnection,
                                                         DatasourceConfiguration datasourceConfiguration,
                                                         ActionConfiguration actionConfiguration,
                                                         List<Map.Entry<String, String>> insertedParams) {

            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();
            initializeResponseWithError(errorResult);

            // Set of hint messages that can be returned to the user.
            Set<String> hintMessages = new HashSet();

            // Initializing request URL
            String url = initializeRequestUrl(actionConfiguration, datasourceConfiguration);
            String reqContentType = "";

            Boolean encodeParamsToggle = isEncodeParamsToggleEnabled(actionConfiguration);

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            URI uri;
            try {
                uri = createFinalUriWithQueryParams(actionConfiguration, datasourceConfiguration, url,
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
                if (isHostDisallowed(uri)) {
                    errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Host not allowed."));
                    errorResult.setRequest(actionExecutionRequest);
                    return Mono.just(errorResult);
                }
            } catch (UnknownHostException e) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Unknown host."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            if (httpMethod == null) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("HTTPMethod must be set."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            WebClient.Builder webClientBuilder = getWebClientBuilder(actionConfiguration, datasourceConfiguration);

            // Adding headers from datasource
            if (datasourceConfiguration.getHeaders() != null) {
                reqContentType = addHeadersToRequestAndGetContentType(
                        webClientBuilder, datasourceConfiguration.getHeaders());
            }

            if (actionConfiguration.getHeaders() != null) {
                reqContentType = addHeadersToRequestAndGetContentType(
                        webClientBuilder, actionConfiguration.getHeaders());
            }

            // Check for content type
            final String contentTypeError = verifyContentType(actionConfiguration.getHeaders());
            if (contentTypeError != null) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Invalid value for Content-Type."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            // We initialize this object to an empty string because body can never be empty
            // Based on the content-type, this Object may be of type MultiValueMap or String
            Object requestBodyObj = "";

            // We will read the request body for all HTTP calls where the apiContentType is NOT "none".
            // This is irrespective of the content-type header or the HTTP method
            String apiContentTypeStr = (String) PluginUtils.getValueSafelyFromFormData(
                    actionConfiguration.getFormData(),
                    FIELD_API_CONTENT_TYPE
            );
            ApiContentType apiContentType = ApiContentType.getValueFromString(apiContentTypeStr);

            if (!httpMethod.equals(HttpMethod.GET)) {
                // Read the body normally as this is a non-GET request
                requestBodyObj = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();
            } else if (apiContentType != null && apiContentType != ApiContentType.NONE) {
                // This is a GET request
                // For all existing GET APIs, the apiContentType will be null. Hence we don't read the body
                // Also, any new APIs which have apiContentType set to NONE shouldn't read the body.
                // All other API content types should read the body
                requestBodyObj = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();
            }

            // TBD: get reqContentType
            if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(reqContentType)
                    || MediaType.MULTIPART_FORM_DATA_VALUE.equals(reqContentType)) {
                requestBodyObj = actionConfiguration.getBodyFormData();
            }

            requestBodyObj = dataUtils.buildBodyInserter(requestBodyObj, reqContentType, encodeParamsToggle);

            WebClient client = getWebClient(webClientBuilder, apiConnection, reqContentType, objectMapper,
                    EXCHANGE_STRATEGIES);

            // Triggering the actual REST API call
            return triggerApiCall(client, httpMethod, uri, requestBodyObj, actionExecutionRequest, objectMapper,
                    hintMessages, errorResult);
        }

        @Override
        public Mono<APIConnection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return APIConnectionFactory.createConnection(datasourceConfiguration.getAuthentication());
        }

        @Override
        public void datasourceDestroy(APIConnection connection) {
            // REST API plugin doesn't have a datasource.
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            // We don't verify whether the URL is in valid format because it can contain mustache template keys, and so
            // look invalid at this point, but become valid after mustache rendering. So we just check if URL field has
            // a non-empty value.

            Set<String> invalids = new HashSet<>();

            if (StringUtils.isEmpty(datasourceConfiguration.getUrl())) {
                invalids.add("Missing URL.");
            }

            final String contentTypeError = verifyContentType(datasourceConfiguration.getHeaders());
            if (contentTypeError != null) {
                invalids.add("Invalid Content-Type: " + contentTypeError);
            }

            if (!CollectionUtils.isEmpty(datasourceConfiguration.getProperties())) {
                boolean isSendSessionEnabled = false;
                String secretKey = null;

                for (Property property : datasourceConfiguration.getProperties()) {
                    if ("isSendSessionEnabled".equals(property.getKey())) {
                        isSendSessionEnabled = "Y".equals(property.getValue());
                    } else if ("sessionSignatureKey".equals(property.getKey())) {
                        secretKey = (String) property.getValue();
                    }
                }

                if (isSendSessionEnabled && (StringUtils.isEmpty(secretKey) || secretKey.length() < 32)) {
                    invalids.add("Secret key is required when sending session is switched on" +
                            ", and should be at least 32 characters long.");
                }
            }

            try {
                getSignatureKey(datasourceConfiguration);
            } catch (AppsmithPluginException e) {
                invalids.add(e.getMessage());
            }

            if (datasourceConfiguration.getAuthentication() != null) {
                invalids.addAll(DatasourceValidator.validateAuthentication(datasourceConfiguration.getAuthentication()));
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            // At this point, the URL can be invalid because of mustache template keys inside it. Hence, connecting to
            // and verifying the URL isn't feasible. Since validation happens just before testing, and since validation
            // checks if a URL is present, there's nothing left to do here, but return a successful response.
            return Mono.just(new DatasourceTestResult());
        }

        private String addHeadersToRequestAndGetContentType(WebClient.Builder webClientBuilder,
                                                            List<Property> headers) {
            String contentType = "";

            for (Property header : headers) {
                String key = header.getKey();
                if (StringUtils.isNotEmpty(key)) {
                    String value = (String) header.getValue();
                    webClientBuilder.defaultHeader(key, value);

                    if (HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(key)) {
                        contentType = value;
                    }
                }
            }
            return contentType;
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

        @Override
        public Mono<ActionExecutionResult> execute(APIConnection apiConnection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Mono<Tuple2<Set<String>, Set<String>>> getHintMessages(ActionConfiguration actionConfiguration,
                                                                      DatasourceConfiguration datasourceConfiguration) {
            return Mono.zip(Mono.just(getDatasourceHintMessages(datasourceConfiguration)),
                    Mono.just(getActionHintMessages(actionConfiguration, datasourceConfiguration)));
        }
    }
}
