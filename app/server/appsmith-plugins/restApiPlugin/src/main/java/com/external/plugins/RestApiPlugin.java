package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.helpers.SSLHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ApiContentType;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.external.services.SharedConfig;
import com.external.connections.APIConnection;
import com.external.connections.APIConnectionFactory;
import com.external.constants.ResponseDataType;
import com.external.helpers.BufferingFilter;
import com.external.helpers.DataUtils;
import com.external.helpers.DatasourceValidator;
import com.external.helpers.RequestCaptureFilter;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.bson.internal.Base64;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;
import reactor.netty.tcp.DefaultSslContextSpec;
import reactor.util.function.Tuple2;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.external.helpers.HintMessageUtils.getActionHintMessages;
import static com.external.helpers.HintMessageUtils.getDatasourceHintMessages;
import static java.lang.Boolean.TRUE;

public class RestApiPlugin extends BasePlugin {
    private static final int MAX_REDIRECTS = 5;

    private static final int SMART_JSON_SUBSTITUTION_INDEX = 0;

    public RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor<APIConnection>, SmartSubstitutionInterface {

        private final String IS_SEND_SESSION_ENABLED_KEY = "isSendSessionEnabled";
        private final String SESSION_SIGNATURE_KEY_KEY = "sessionSignatureKey";
        private final String SIGNATURE_HEADER_NAME = "X-APPSMITH-SIGNATURE";
        private final String RESPONSE_DATA_TYPE = "X-APPSMITH-DATATYPE";
        private final Set binaryDataTypes = Set.of("application/zip",
                "application/octet-stream",
                "application/pdf",
                "application/pkcs8",
                "application/x-binary");
        private final String FIELD_API_CONTENT_TYPE = "apiContentType";

        private final SharedConfig sharedConfig;
        private final DataUtils dataUtils;

        // Setting max content length. This would've been coming from `spring.codec.max-in-memory-size` property if the
        // `WebClient` instance was loaded as an auto-wired bean.
        public ExchangeStrategies EXCHANGE_STRATEGIES;

        private static final Set<String> DISALLOWED_HOSTS = Set.of(
                "169.254.169.254",
                "metadata.google.internal"
        );

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

            Boolean smartJsonSubstitution;
            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            if (CollectionUtils.isEmpty(properties)) {
                // In case the smart json substitution configuration is missing, default to true
                smartJsonSubstitution = true;

                // Since properties is not empty, we are guaranteed to find the first property.
            } else if (properties.get(SMART_JSON_SUBSTITUTION_INDEX) != null) {
                Object ssubValue = properties.get(SMART_JSON_SUBSTITUTION_INDEX).getValue();
                if (ssubValue instanceof Boolean) {
                    smartJsonSubstitution = (Boolean) ssubValue;
                } else if (ssubValue instanceof String) {
                    smartJsonSubstitution = Boolean.parseBoolean((String) ssubValue);
                } else {
                    smartJsonSubstitution = true;
                }
            } else {
                smartJsonSubstitution = true;
            }

            // Smartly substitute in actionConfiguration.body and replace all the bindings with values.
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
            if (actionConfiguration.getHeaders() != null && !actionConfiguration.getHeaders().isEmpty()) {
                List<Property> headerList = actionConfiguration.getHeaders().stream()
                        .filter(header -> !org.springframework.util.StringUtils.isEmpty(header.getKey()))
                        .collect(Collectors.toList());
                actionConfiguration.setHeaders(headerList);
            }

            return this.executeCommon(connection, datasourceConfiguration, actionConfiguration, parameters);
        }

        public Mono<ActionExecutionResult> executeCommon(APIConnection apiConnection,
                                                         DatasourceConfiguration datasourceConfiguration,
                                                         ActionConfiguration actionConfiguration,
                                                         List<Map.Entry<String, String>> insertedParams) {

            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();
            errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
            errorResult.setIsExecutionSuccess(false);
            errorResult.setTitle(AppsmithPluginError.PLUGIN_ERROR.getTitle());

            // Set of hint messages that can be returned to the user.
            Set<String> hintMessages = new HashSet();

            // Initializing request URL
            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = datasourceConfiguration.getUrl() + path;
            String reqContentType = "";

            /*
             * - If encodeParamsToggle is null, then assume it to be true because params are supposed to be
             *   encoded by default, unless explicitly prohibited by the user.
             */
            Boolean encodeParamsToggle = true;
            if (actionConfiguration.getEncodeParamsToggle() != null
                    && actionConfiguration.getEncodeParamsToggle() == false) {
                encodeParamsToggle = false;
            }

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            URI uri;
            try {
                String httpUrl = addHttpToUrlWhenPrefixNotPresent(url);

                ArrayList<Property> allQueryParams = new ArrayList<>();
                if (!CollectionUtils.isEmpty(actionConfiguration.getQueryParameters())) {
                    allQueryParams.addAll(actionConfiguration.getQueryParameters());
                }

                if (!CollectionUtils.isEmpty(datasourceConfiguration.getQueryParameters())) {
                    allQueryParams.addAll(datasourceConfiguration.getQueryParameters());
                }

                uri = createFinalUriWithQueryParams(httpUrl, allQueryParams, encodeParamsToggle);
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
                final String host = uri.getHost();
                if (StringUtils.isEmpty(host)
                        || DISALLOWED_HOSTS.contains(host)
                        || DISALLOWED_HOSTS.contains(InetAddress.getByName(host).getHostAddress())) {
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

            // Initializing webClient to be used for http call
            final ConnectionProvider provider = ConnectionProvider
                    .builder("rest-api-provider")
                    .maxIdleTime(Duration.ofSeconds(600))
                    .maxLifeTime(Duration.ofSeconds(600))
                    .build();

            HttpClient httpClient = HttpClient.create(provider)
                    .secure(sslContextSpec -> {

                        final DefaultSslContextSpec sslContextSpec1 = DefaultSslContextSpec.forClient();

                        if (datasourceConfiguration.getConnection() != null &&
                                datasourceConfiguration.getConnection().getSsl() != null &&
                                datasourceConfiguration.getConnection().getSsl().getAuthType() == SSLDetails.AuthType.SELF_SIGNED_CERTIFICATE) {

                            sslContextSpec1.configure(sslContextBuilder -> {
                                try {
                                    final UploadedFile certificateFile = datasourceConfiguration.getConnection().getSsl().getCertificateFile();
                                    sslContextBuilder.trustManager(SSLHelper.getSslTrustManagerFactory(certificateFile));
                                } catch (CertificateException | KeyStoreException | IOException | NoSuchAlgorithmException e) {
                                    e.printStackTrace();
                                }
                            });
                        }
                        sslContextSpec.sslContext(sslContextSpec1);
                    });

            WebClient.Builder webClientBuilder = WebClient.builder().clientConnector(new ReactorClientHttpConnector(httpClient));

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

            if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(reqContentType)
                    || MediaType.MULTIPART_FORM_DATA_VALUE.equals(reqContentType)) {
                requestBodyObj = actionConfiguration.getBodyFormData();
            }

            // If users have chosen to share the Appsmith signature in the header, calculate and add that
            String secretKey;
            try {
                secretKey = getSignatureKey(datasourceConfiguration);
            } catch (AppsmithPluginException e) {
                return Mono.error(e);
            }

            if (secretKey != null) {
                final SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
                final Instant now = Instant.now();
                final String token = Jwts.builder()
                        .setIssuer("Appsmith")
                        .setIssuedAt(new Date(now.toEpochMilli()))
                        .setExpiration(new Date(now.plusSeconds(600).toEpochMilli()))
                        .signWith(key)
                        .compact();

                webClientBuilder.defaultHeader(SIGNATURE_HEADER_NAME, token);
            }

            // Right before building the webclient object, we populate it with whatever mutation the APIConnection object demands
            if (apiConnection != null) {
                webClientBuilder.filter(apiConnection);
            }

            requestBodyObj = dataUtils.buildBodyInserter(requestBodyObj, reqContentType, encodeParamsToggle);

            if (MediaType.MULTIPART_FORM_DATA_VALUE.equals(reqContentType)) {
                webClientBuilder.filter(new BufferingFilter());
            }

            final RequestCaptureFilter requestCaptureFilter = new RequestCaptureFilter(objectMapper);
            webClientBuilder.filter(requestCaptureFilter);

            WebClient client = webClientBuilder.exchangeStrategies(EXCHANGE_STRATEGIES).build();

            // Triggering the actual REST API call
            return httpCall(client, httpMethod, uri, requestBodyObj, 0, reqContentType)
                    .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                    .map(stringResponseEntity -> {
                        HttpHeaders headers = stringResponseEntity.getHeaders();
                        // Find the media type of the response to parse the body as required.
                        MediaType contentType = headers.getContentType();
                        byte[] body = stringResponseEntity.getBody();
                        HttpStatus statusCode = stringResponseEntity.getStatusCode();

                        ActionExecutionResult result = new ActionExecutionResult();

                        // Set the request fields
                        result.setRequest(requestCaptureFilter.populateRequestFields(actionExecutionRequest));

                        result.setStatusCode(statusCode.toString());
                        result.setIsExecutionSuccess(statusCode.is2xxSuccessful());

                        // Convert the headers into json tree to store in the results
                        String headerInJsonString;
                        try {
                            headerInJsonString = objectMapper.writeValueAsString(headers);
                        } catch (JsonProcessingException e) {
                            throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                        }

                        // Set headers in the result now
                        try {
                            result.setHeaders(objectMapper.readTree(headerInJsonString));
                        } catch (IOException e) {
                            throw Exceptions.propagate(
                                    new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                            headerInJsonString,
                                            e.getMessage()
                                    )
                            );
                        }

                        if (body != null) {

                            ResponseDataType responseDataType = ResponseDataType.UNDEFINED;

                            /**TODO
                             * Handle XML response. Currently we only handle JSON & Image responses. The other kind of responses
                             * are kept as is and returned as a string.
                             */
                            if (MediaType.APPLICATION_JSON.equals(contentType) ||
                                    MediaType.APPLICATION_JSON_UTF8.equals(contentType)) {
                                try {
                                    String jsonBody = new String(body, StandardCharsets.UTF_8);
                                    result.setBody(objectMapper.readTree(jsonBody));
                                    responseDataType = ResponseDataType.JSON;
                                } catch (IOException e) {
                                    System.out.println("Unable to parse response JSON. Setting response body as string.");
                                    String bodyString = new String(body, StandardCharsets.UTF_8);
                                    result.setBody(bodyString.trim());

                                    // Warn user that the API response is not a valid JSON.
                                    hintMessages.add("The response returned by this API is not a valid JSON. Please " +
                                            "be careful when using the API response anywhere a valid JSON is required" +
                                            ". You may resolve this issue either by modifying the 'Content-Type' " +
                                            "Header to indicate a non-JSON response or by modifying the API response " +
                                            "to return a valid JSON.");
                                }
                            } else if (MediaType.IMAGE_GIF.equals(contentType) ||
                                    MediaType.IMAGE_JPEG.equals(contentType) ||
                                    MediaType.IMAGE_PNG.equals(contentType)) {
                                String encode = Base64.encode(body);
                                result.setBody(encode);
                                responseDataType = ResponseDataType.IMAGE;
                            } else if (binaryDataTypes.contains(contentType.toString())) {
                                String encode = Base64.encode(body);
                                result.setBody(encode);
                                responseDataType = ResponseDataType.BINARY;
                            } else {
                                // If the body is not of JSON type, just set it as is.
                                String bodyString = new String(body, StandardCharsets.UTF_8);
                                result.setBody(bodyString.trim());
                                responseDataType = ResponseDataType.TEXT;
                            }

                            // Now add a new header which specifies the data type of the response as per Appsmith
                            JsonNode headersJsonNode = result.getHeaders();
                            ObjectNode headersObjectNode = (ObjectNode) headersJsonNode;
                            headersObjectNode.putArray(RESPONSE_DATA_TYPE)
                                    .add(String.valueOf(responseDataType));
                            result.setHeaders(headersObjectNode);

                        }

                        result.setMessages(hintMessages);
                        return result;
                    })
                    .onErrorResume(error -> {
                        errorResult.setRequest(requestCaptureFilter.populateRequestFields(actionExecutionRequest));
                        errorResult.setIsExecutionSuccess(false);
                        errorResult.setErrorInfo(error);
                        return Mono.just(errorResult);
                    });
        }

        private String getSignatureKey(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
            if (!CollectionUtils.isEmpty(datasourceConfiguration.getProperties())) {
                boolean isSendSessionEnabled = false;
                String secretKey = null;

                for (Property property : datasourceConfiguration.getProperties()) {
                    if (IS_SEND_SESSION_ENABLED_KEY.equals(property.getKey())) {
                        isSendSessionEnabled = "Y".equals(property.getValue());
                    } else if (SESSION_SIGNATURE_KEY_KEY.equals(property.getKey())) {
                        secretKey = (String) property.getValue();
                    }
                }

                if (isSendSessionEnabled) {
                    if (StringUtils.isEmpty(secretKey) || secretKey.length() < 32) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                "Secret key is required when sending session details is switched on," +
                                        " and should be at least 32 characters in length."
                        );
                    }
                    return secretKey;
                }
            }

            return null;
        }

        /**
         * If the headers list of properties contains a `Content-Type` header, verify if the value of that header is a
         * valid media type.
         *
         * @param headers List of header Property objects to look for Content-Type headers in.
         * @return An error message string if the Content-Type value is invalid, otherwise `null`.
         */
        private static String verifyContentType(List<Property> headers) {
            if (headers == null) {
                return null;
            }

            for (Property header : headers) {
                if (StringUtils.isNotEmpty(header.getKey()) && header.getKey().equalsIgnoreCase(HttpHeaders.CONTENT_TYPE)) {
                    try {
                        MediaType.valueOf((String) header.getValue());
                    } catch (InvalidMediaTypeException e) {
                        return e.getMessage();
                    }
                    // Don't break here since there can be multiple `Content-Type` headers.
                }
            }

            return null;
        }

        private Mono<ClientResponse> httpCall(WebClient webClient, HttpMethod httpMethod, URI uri, Object requestBody,
                                              int iteration, String contentType) {
            if (iteration == MAX_REDIRECTS) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Exceeded the HTTP redirect limits of " + MAX_REDIRECTS
                ));
            }

            assert requestBody instanceof BodyInserter<?, ?>;
            BodyInserter<?, ?> finalRequestBody = (BodyInserter<?, ?>) requestBody;

            return webClient
                    .method(httpMethod)
                    .uri(uri)
                    .body((BodyInserter<?, ? super ClientHttpRequest>) finalRequestBody)
                    .exchange()
                    .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                    .flatMap(response -> {
                        if (response.statusCode().is3xxRedirection()) {
                            String redirectUrl = response.headers().header("Location").get(0);
                            /**
                             * TODO
                             * In case the redirected URL is not absolute (complete), create the new URL using the relative path
                             * This particular scenario is seen in the URL : https://rickandmortyapi.com/api/character
                             * It redirects to partial URI : /api/character/
                             * In this scenario we should convert the partial URI to complete URI
                             */
                            URI redirectUri = null;
                            try {
                                redirectUri = new URI(redirectUrl);
                            } catch (URISyntaxException e) {
                                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                            }
                            return httpCall(webClient, httpMethod, redirectUri, finalRequestBody, iteration + 1,
                                    contentType);
                        }
                        return Mono.just(response);
                    });
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

        private String addHttpToUrlWhenPrefixNotPresent(String url) {
            if (url == null || url.toLowerCase().startsWith("http") || url.contains("://")) {
                return url;
            }
            return "http://" + url;
        }

        private URI createFinalUriWithQueryParams(String url,
                                                  List<Property> queryParams,
                                                  Boolean encodeParamsToggle) throws URISyntaxException {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            uriBuilder.uri(new URI(url));

            if (queryParams != null) {
                for (Property queryParam : queryParams) {
                    String key = queryParam.getKey();
                    if (StringUtils.isNotEmpty(key)) {
                        if (encodeParamsToggle == true) {
                            uriBuilder.queryParam(
                                    URLEncoder.encode(key, StandardCharsets.UTF_8),
                                    URLEncoder.encode((String) queryParam.getValue(), StandardCharsets.UTF_8)
                            );
                        } else {
                            uriBuilder.queryParam(
                                    key,
                                    queryParam.getValue()
                            );
                        }
                    }
                }
            }
            return uriBuilder.build(true).toUri();
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
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(jsonBody, value, insertedParams, null);
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
